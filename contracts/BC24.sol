// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract BC24 is ERC1155, ERC1155Burnable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Event to log the minting of a new ressource
    event ResourceCreatedEvent(
        uint256 tokenId,
        string ressourceName,
        string message,
        address caller
    );

    event ResourceMetaDataChangedEvent(
        uint256 tokenId,
        MetaData metaData,
        address caller
    );

    // Holds the metadata of a ressource
    // data: the metadata of the ressource in string format
    // ressourceName: the name of the ressource. Automattically taken from the template
    // usedToCreate: an array of the tokenIds used to create this ressource (TRACABILITY OF EXACT TOKENS USED TO CREATE A NEW ONE)
    struct Data {
        string required_role;
        string dataString;
        address lastModifiedBy;
        uint lastModifiedAt;
    }

    struct MetaData {
        Data[] data;
        uint256 resourceId;
        string ressourceName;
        uint256[] ingredients;
    }

    // Holds the template of a ressource.
    // This makes the whole system more modular and allows for easy addition of new ressources
    // TODO: Add a way to add new ressources to the system
    struct ResourceTemplate {
        uint256 ressource_id;
        string ressource_name;
        uint256[] ressources_needed;
        uint256[] ressources_needed_amounts;
        uint256 initialAmountFromTemplate;
        string required_role;
        uint256[] producesResources;
        uint256[] producesResourcesAmounts;
    }

    // ResourceId to ResourceTemplate mapping
    mapping(uint256 => ResourceTemplate) public ressourceTemplates;

    // TokenId to MetaData mapping
    mapping(uint256 => MetaData) public metaData;

    // ResourceId to TokenId mapping
    // This is needed if we want to know which tokens are of a certain type in the minining and bruning process
    mapping(uint => uint[]) public tokensByResourceType;

    // User to Role mapping
    mapping(address => string) public userRoles;

    // TokenId counter
    uint256 globalTokenId = 65;

    constructor(ResourceTemplate[] memory _ressourceTemplates) ERC1155("") {
        require(
            _ressourceTemplates.length > 0,
            "At least one ressource template is required"
        );

        for (uint i = 0; i < _ressourceTemplates.length; i++) {
            require(
                _ressourceTemplates[i].ressource_id != 0,
                "None of your resourcess can have an id of 0"
            );
        }

        _grantRole(ADMIN_ROLE, msg.sender);

        // Populate the resourceTemplates mapping
        for (uint i = 0; i < _ressourceTemplates.length; i++) {
            ressourceTemplates[
                _ressourceTemplates[i].ressource_id
            ] = _ressourceTemplates[i];
        }
    }

    function giveUserRole(address account, string memory role) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can assign role");
        _grantRole(keccak256(abi.encode(role)), account);
        userRoles[account] = role;
    }

    function getMetaData(uint256 id) public view returns (MetaData memory) {
        return metaData[id];
    }

    function setMetaData(uint256 tokenId, string memory _metaData) public {
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
                balanceOf(msg.sender, tokenId) > 0,
            "Only admin or owner can set metadata"
        );

        MetaData storage metaDataArray = metaData[tokenId];
        Data[] storage data = metaDataArray.data;
        bool metaDataForRoleDoesNotExists = true;

        for (uint i = 0; i < data.length; i++) {
            if (
                hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(
                    keccak256(abi.encode(data[i].required_role)),
                    msg.sender
                )
            ) {
                data[i].dataString = _metaData;
                data[i].lastModifiedBy = msg.sender;
                data[i].lastModifiedAt = block.timestamp;
                metaDataForRoleDoesNotExists = false;
            }
        }

        if (metaDataForRoleDoesNotExists) {
            Data memory newDataOfRole = Data({
                dataString: _metaData,
                required_role: userRoles[msg.sender],
                lastModifiedBy: msg.sender,
                lastModifiedAt: block.timestamp
            });
            data.push(newDataOfRole);
        }

        emit ResourceMetaDataChangedEvent(tokenId, metaDataArray, msg.sender);
    }

    function mintOneToMany(
        uint256 producerToken,
        string memory _metaData
    ) public {
        require(
            balanceOf(msg.sender, producerToken) > 0,
            "This Resource has been already been used."
        );

        ResourceTemplate storage resourceTemplate = ressourceTemplates[
            metaData[producerToken].resourceId
        ];

        uint256[] memory produces = resourceTemplate.producesResources;

        for (uint i = 0; i < produces.length; i++) {
            ResourceTemplate
                storage producedResourceTemplate = ressourceTemplates[
                    produces[i]
                ];

            for (
                uint j = 0;
                j < resourceTemplate.producesResourcesAmounts[i];
                j++
            ) {
                _mint(
                    msg.sender,
                    globalTokenId,
                    producedResourceTemplate.initialAmountFromTemplate,
                    ""
                );
                MetaData storage meta = metaData[globalTokenId];
                meta.resourceId = producedResourceTemplate.ressource_id;
                meta.ressourceName = producedResourceTemplate.ressource_name;
                meta.ingredients.push(producerToken);
                meta.data.push(
                    Data({
                        dataString: _metaData,
                        required_role: producedResourceTemplate.required_role,
                        lastModifiedBy: msg.sender,
                        lastModifiedAt: block.timestamp
                    })
                );

                emit ResourceCreatedEvent(
                    globalTokenId,
                    producedResourceTemplate.ressource_name,
                    string(
                        abi.encodePacked(
                            meta.ressourceName,
                            " created from ",
                            metaData[producerToken].ressourceName
                        )
                    ),
                    msg.sender
                );

                emit ResourceMetaDataChangedEvent(
                    globalTokenId,
                    meta,
                    msg.sender
                );

                globalTokenId++;
            }
        }

        _burn(msg.sender, producerToken, 1);
    }

    function mintRessource(
        uint256 resourceId,
        uint256 quantity,
        string memory _metaData,
        uint256[] memory ingredients
    ) public {
        // Get the actual ressource template
        ResourceTemplate storage resourceTemplate = ressourceTemplates[
            resourceId
        ];

        // Check if the ressourceId is valid and an actual ressource can be created from it
        require(
            resourceTemplate.ressource_id != 0 &&
                keccak256(abi.encodePacked(resourceTemplate.ressource_name)) !=
                keccak256(abi.encodePacked("")),
            "Resource does not seem to exists in the system. Please check the id and try again. Otherwise contact the admin to add a new ressource to the system."
        );

        // Check if the caller has the right to mint the ressource
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(
                    keccak256(abi.encode(resourceTemplate.required_role)),
                    msg.sender
                ),
            "Caller does not have the right to use the process"
        );

        // Check if the call require(
        hasResourcesToMintItem(resourceTemplate, quantity, ingredients);

        // Mint the new ressource
        // if the ressource is not fungible (NFT), mint only one
        // if the ressource is fungible, mint the quantity specified

        for (uint i = 0; i < quantity; i++) {
            // Burn the resources needed to mint the ressource
            uint256[] memory burntIngredients = _burnResources(
                resourceTemplate,
                1,
                ingredients
            );
            _mint(
                msg.sender,
                globalTokenId,
                resourceTemplate.initialAmountFromTemplate,
                ""
            );

            // Create the unique metadata for each newly minted resource
            MetaData storage meta = metaData[globalTokenId];

            meta.resourceId = resourceTemplate.ressource_id;
            meta.ressourceName = resourceTemplate.ressource_name;
            meta.ingredients = burntIngredients;
            meta.data.push(
                Data({
                    dataString: _metaData,
                    required_role: resourceTemplate.required_role,
                    lastModifiedBy: msg.sender,
                    lastModifiedAt: block.timestamp
                })
            );

            // Add the tokenId to the resource type mapping
            tokensByResourceType[resourceId].push(globalTokenId);

            // Emit the ResourceEvent
            emit ResourceCreatedEvent(
                globalTokenId,
                meta.ressourceName,
                "New ressource created",
                msg.sender
            );

            emit ResourceMetaDataChangedEvent(globalTokenId, meta, msg.sender);

            globalTokenId++;
        }
    }

    function hasResourcesToMintItem(
        ResourceTemplate memory template,
        uint256 quantity,
        uint256[] memory ingredients
    ) public view returns (bool) {
        bool returnValue = true;
        for (uint i = 0; i < template.ressources_needed.length; i++) {
            // get the needed resource ids from the template to create the new ressource
            uint256 neededResourceId = template.ressources_needed[i];
            uint256 neededAmount = template.ressources_needed_amounts[i];

            uint256 totalResourceBalance = 0;

            for (uint j = 0; j < ingredients.length; j++) {
                // Get the metaData of the ingredient
                MetaData storage meta = metaData[ingredients[j]];
                // If the resourceId of the ingredient matches the specific resourceId
                if (meta.resourceId == neededResourceId) {
                    // Get the balance of the ingredient
                    uint256 balance = balanceOf(msg.sender, ingredients[j]);
                    // Add the balance to the total balance
                    totalResourceBalance += balance;
                }
            }

            uint256 possibleQuantity = totalResourceBalance / neededAmount;

            // Check if the ingredient provided ingredient list contains enough of the needed resource
            if (possibleQuantity < quantity) {
                // Revert with a message that includes the possible quantity
                returnValue = false;
                revert(
                    string(
                        abi.encodePacked(
                            "\nYou do not have the required resource (",
                            ressourceTemplates[template.ressources_needed[i]]
                                .ressource_name,
                            ") to perform this action.\n",
                            "You have: ",
                            Strings.toString(totalResourceBalance),
                            "\n",
                            "You need: ",
                            Strings.toString(neededAmount * quantity),
                            "\n",
                            "With the resources in your possession, you could create ",
                            Strings.toString(possibleQuantity),
                            " items."
                        )
                    )
                );
            }
        }
        return returnValue;
    }

    function _burnResources(
        ResourceTemplate memory template,
        uint256 quantity,
        uint256[] memory ingredients
    ) public returns (uint256[] memory) {
        uint256[] memory burntIngredients = new uint256[](ingredients.length);
        uint256 burntIngredientsCount = 0;
        for (uint i = 0; i < template.ressources_needed.length; i++) {
            // get the current resource id from the template to create the new ressource
            uint256 neededResourceId = template.ressources_needed[i];

            // calculate the needed amount of the resource
            // for example: if the template says we need 20 (20g) of beef shoulder to create a new ressource and the quantity is 5, we need 100 (100g) of beef shoulder
            uint256 neededAmount = template.ressources_needed_amounts[i] *
                quantity;

            for (uint j = 0; j < ingredients.length; j++) {
                uint256 resource = ingredients[j];
                // If the resourceId of the ingredient matches the specific resourceId
                if (metaData[resource].resourceId == neededResourceId) {
                    // Get the balance of the ingredient
                    uint256 availableAmount = balanceOf(msg.sender, resource);

                    uint256 amountToBurn = availableAmount >= neededAmount
                        ? neededAmount
                        : availableAmount;

                    if (amountToBurn == 0) {
                        continue;
                    }

                    _burn(msg.sender, resource, amountToBurn);

                    // TRACEABILITY: add the used resources to the metadata of the newly created resource
                    burntIngredients[burntIngredientsCount] = resource;
                    burntIngredientsCount++;

                    neededAmount -= amountToBurn;
                }
            }
        }
        return burntIngredients;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, ERC1155) returns (bool) {}
}
