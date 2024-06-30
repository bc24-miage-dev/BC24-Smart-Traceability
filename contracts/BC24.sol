// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract BC24 is ERC1155, ERC1155Burnable, AccessControl {
    string public name = "BC24";
    string public symbol = "BC24";

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

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

    struct Data {
        string required_role;
        string dataString;
        address lastModifiedBy;
        uint256 lastModifiedAt;
    }

    struct MetaData {
        Data[] data;
        uint256 resourceId;
        string ressourceName;
        string ressourceType;
        uint256[] ingredients;
    }

    struct ResourceTemplate {
        uint256 ressource_id;
        string ressource_name;
        uint256[] needed_resources;
        uint256[] needed_resources_amounts;
        uint256 initial_amount_minted;
        string required_role;
        uint256[] produces_resources;
        uint256[] produces_resources_amounts;
        string ressource_type;
    }

    // ResourceId to ResourceTemplate mapping for easy access
    mapping(uint256 => ResourceTemplate) private ressourceTemplates;

    // Resource array to store all the resources
    ResourceTemplate[] private allRessourceTemplates;

    // TokenId to MetaData mapping
    mapping(uint256 => MetaData) public metaData;

    // ResourceId to TokenId mapping
    // This is needed if we want to know which tokens are of a certain type in the minining and bruning process
    mapping(uint => uint[]) public tokensByResourceType;

    // User to Role mapping
    mapping(address => string) public userRoles;

    // TokenId counter
    uint256 globalTokenId = 65;

    constructor(
        address admin,
        ResourceTemplate[] memory _ressourceTemplates
    ) ERC1155("") {
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

        // Grant the admin role to the contract creator
        _grantRole(ADMIN_ROLE, admin);
        giveUserRole(admin, "ADMIN_ROLE");

        // Populate the resourceTemplates mapping
        for (uint i = 0; i < _ressourceTemplates.length; i++) {
            allRessourceTemplates.push(_ressourceTemplates[i]);
            ressourceTemplates[
                _ressourceTemplates[i].ressource_id
            ] = _ressourceTemplates[i];
        }
    }

    /**
     * Assigns a user role to an account.
     *
     * This function updates the role of a user account. It requires the caller to have the ADMIN_ROLE
     * to ensure only authorized users can assign roles. Upon successful role assignment, the user's role
     * is updated in the `userRoles` mapping for easier role verification.
     *
     * @param account - The address of the user account to assign the role to.
     * @param role - The role to be assigned to the user account.
     *
     * Requirements:
     * - The caller must have `ADMIN_ROLE`.
     */
    function giveUserRole(address account, string memory role) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can assign role");
        _grantRole(keccak256(abi.encode(role)), account);
        userRoles[account] = role;
    }

    /**
     * Retrieves all resource templates.
     *
     * Returns an array of all resource templates stored in the contract.
     *
     * @return ResourceTemplate[] - An array of resource template structures.
     */
    function getResourceTemplates()
        public
        view
        returns (ResourceTemplate[] memory)
    {
        return allRessourceTemplates;
    }

    /**
     * Retrieves the current metadata for a given ID.
     *
     * @param id - The unique identifier for the token Id which metadata is retrieve.
     *
     * @return MetaData - The metadata structure associated with the given ID.
     */
    function getMetaData(uint256 id) public view returns (MetaData memory) {
        return metaData[id];
    }

    /**
     * Sets metadata for a given token ID.
     *
     * Allows setting of metadata for a token specified by `tokenId`. This function is restricted
     * to the `Token Owner` or an account with the `ADMIN_ROLE`.
     *
     * The metadata can be stored by and for a specific role. This allows for different metadata to be stored
     * simultaneously for the same token. The metadata is stored in the `MetaData` structure which contains
     * an array of `Data` structures. Each `Data` structure contains the metadata string.
     *
     *  - See the `MetaData` struct for more information.
     *
     * @param tokenId - The unique identifier for the token.
     * @param _metaData - The metadata in string format to be associated with the token.
     *
     * Requirements:
     * - The caller must be the owner of the token
     * - or have the `ADMIN_ROLE`.
     */
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

    /**
     * Mint a new resource.
     *
     * This function allows minting several new resources based on the produces_resources property of the resource template.
     * This will facilitates the creation of multiple tokens from a single token.
     *
     * Example: A a demi carcass of beef can produce multiple cuts of pieces of meat, such as ribs, steaks, etc.
     *
     * The metadata for the new resource is set to the metadata specified by `_metaData`.
     *
     * @param producerToken - The unique identifier for the token that produces the new resource.
     * @param _metaData - The metadata to be associated with the new resource.
     *
     * Requirements:
     * - The caller must be the owner of the producer token.
     * - The caller must have the required role to create the subsequent resources.
     */
    function mintOneToMany(
        uint256 producerToken,
        string memory _metaData
    ) public {
        ResourceTemplate storage resourceTemplate = ressourceTemplates[
            metaData[producerToken].resourceId
        ];

        uint256[] memory produces = resourceTemplate.produces_resources;
        uint256[] memory producesAmount = resourceTemplate
            .produces_resources_amounts;

        require(
            resourceTemplate.produces_resources.length > 0,
            "This Resource does not produce any other resources."
        );

        require(
            balanceOf(msg.sender, producerToken) > 0,
            "This Resource has been already been used."
        );

        for (uint i = 0; i < produces.length; i++) {
            ResourceTemplate
                storage producedResourceTemplate = ressourceTemplates[
                    produces[i]
                ];
            require(
                hasRole(ADMIN_ROLE, msg.sender) ||
                    hasRole(
                        keccak256(
                            abi.encode(producedResourceTemplate.required_role)
                        ),
                        msg.sender
                    ),
                "Caller does not have the required role to mint new tokens"
            );
        }

        for (uint i = 0; i < produces.length; i++) {
            ResourceTemplate
                storage producedResourceTemplate = ressourceTemplates[
                    produces[i]
                ];

            for (uint j = 0; j < producesAmount[i]; j++) {
                _mint(
                    msg.sender,
                    globalTokenId,
                    producedResourceTemplate.initial_amount_minted,
                    ""
                );
                MetaData storage meta = metaData[globalTokenId];
                meta.resourceId = producedResourceTemplate.ressource_id;
                meta.ressourceName = producedResourceTemplate.ressource_name;
                meta.ressourceType = producedResourceTemplate.ressource_type;
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

    /**
     * Mint a new resource.
     *
     * This function allows minting a new resource based on the resource template specified by `resourceId`.
     * The caller must have the required resources to mint the new resource. The required resources are specified
     * in the resource template. The caller must also have the required role to mint the new resource.
     *
     * The metadata for the new resource is set to the metadata specified by `_metaData`.
     *
     * @param resourceId - The unique identifier for the resource template.
     * @param quantity - The quantity of the resource to mint.
     * @param _metaData - The metadata to be associated with the new resource.
     * @param ingredients - The ingredients used to mint the new resource.
     *
     * Requirements:
     * - The caller must have the required resources to mint the new resource.
     * - The caller must be the owner of the producer token.
     */
    function mintRessource(
        uint256 resourceId,
        uint256 quantity,
        string memory _metaData,
        uint256[] memory ingredients
    ) public {
        ResourceTemplate storage resourceTemplate = ressourceTemplates[
            resourceId
        ];

        isValidResource(resourceTemplate, quantity, ingredients);

        // Mint the new ressource
        // if the ressource is not fungible (NFT), mint only one
        // if the ressource is fungible, mint the quantity specified
        for (uint i = 0; i < quantity; i++) {
            uint256[] memory burntIngredients = _burnResources(
                resourceTemplate,
                1,
                ingredients
            );
            _mint(
                msg.sender,
                globalTokenId,
                resourceTemplate.initial_amount_minted,
                ""
            );

            MetaData storage meta = metaData[globalTokenId];

            meta.resourceId = resourceTemplate.ressource_id;
            meta.ressourceName = resourceTemplate.ressource_name;
            meta.ressourceType = resourceTemplate.ressource_type;
            meta.ingredients = burntIngredients;
            meta.data.push(
                Data({
                    dataString: _metaData,
                    required_role: resourceTemplate.required_role,
                    lastModifiedBy: msg.sender,
                    lastModifiedAt: block.timestamp
                })
            );

            tokensByResourceType[resourceId].push(globalTokenId);

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

    /**
     * Validates if a resource can be created based on the given template and quantity.
     *
     * This function performs several checks to ensure that a resource specified by the `resourceTemplate`
     * can be validly created. It verifies the existence and uniqueness of the resource, the caller's
     * authorization, and whether the necessary ingredients are available for minting the specified quantity
     * of the resource.
     *
     * @param resourceTemplate - A struct containing the details of the resource to be created, including
     *                           its ID and required role for creation.
     * @param quantity - The amount of the resource to be created.
     * @param ingredients - An array of ingredient IDs provided to create the resource.
     *
     * Requirements:
     * - The resource must exist within the system and have a unique ID.
     * - The caller must have the appropriate role to create the resource.
     * - The resource to be created cannot be present in another resource produce_resources list,
     *          as in this case it would have to be created via mintOneToMany.
     * - All necessary ingredients for creating the specified quantity of the resource must be available.
     */
    function isValidResource(
        ResourceTemplate memory resourceTemplate,
        uint256 quantity,
        uint256[] memory ingredients
    ) private view {
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

        // Ensure the resource_id is not present in any other resource's produces_resources
        bool isResourceIdUnique = true;

        for (uint i = 0; i < allRessourceTemplates.length; i++) {
            uint256[] memory producesResources = allRessourceTemplates[i]
                .produces_resources;

            for (uint j = 0; j < producesResources.length; j++) {
                if (producesResources[j] == resourceTemplate.ressource_id) {
                    isResourceIdUnique = false;
                    break;
                }
            }

            if (!isResourceIdUnique) {
                break;
            }
        }

        require(
            isResourceIdUnique,
            "This resource needs to be created from a producer resource."
        );

        // the caller must have the required resources to mint the new resource
        hasResourcesToMintItem(resourceTemplate, quantity, ingredients);
    }

    /**
     * Checks if the caller has the required resources to mint the new resource.
     *
     * This function checks if the caller has the necessary resources to mint the new resource specified by the
     * `template`. It verifies the availability of the required resources in the caller's inventory and calculates
     * the possible quantity of the new resource that can be created based on the available resources.
     *
     * @param template - A struct containing the details of the resource to be created, including the IDs of the
     *                   required resources and their amounts.
     * @param quantity - The amount of the resource to be created.
     * @param ingredients - An array of ingredient IDs provided to create the resource.
     *
     * @return bool - A boolean value indicating whether the caller has the required resources to mint the new resource.
     */
    function hasResourcesToMintItem(
        ResourceTemplate memory template,
        uint256 quantity,
        uint256[] memory ingredients
    ) private view returns (bool) {
        bool returnValue = true;
        for (uint i = 0; i < template.needed_resources.length; i++) {
            // get the needed resource ids from the template to create the new ressource
            uint256 neededResourceId = template.needed_resources[i];
            uint256 neededAmount = template.needed_resources_amounts[i];

            uint256 totalResourceBalance = 0;

            // Check if the ingredient provided ingredient list contains enough of the needed resource
            for (uint j = 0; j < ingredients.length; j++) {
                MetaData storage meta = metaData[ingredients[j]];
                if (meta.resourceId == neededResourceId) {
                    uint256 balance = balanceOf(msg.sender, ingredients[j]);
                    totalResourceBalance += balance;
                }
            }
            uint256 possibleQuantity = totalResourceBalance / neededAmount;

            if (possibleQuantity < quantity) {
                // If not, revert with a message that includes the possible quantity
                returnValue = false;
                revert(
                    string(
                        abi.encodePacked(
                            "\nYou do not have the required resource (",
                            ressourceTemplates[template.needed_resources[i]]
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

    /**
     * Burns the required resources to create a new resource.
     *
     * This function burns the necessary resources to create a new resource specified by the `template`. It iterates
     * through the ingredients provided to create the new resource and burns the required amount of each ingredient.
     * The burned ingredients are stored in an array for traceability purposes.
     *
     * @param template - A struct containing the details of the resource to be created, including the IDs of the
     *                   required resources and their amounts.
     * @param quantity - The amount of the resource to be created.
     * @param ingredients - An array of ingredient IDs provided to create the resource.
     *
     * @return uint256[] - An array of ingredient IDs that were burned to create the new resource.
     */
    function _burnResources(
        ResourceTemplate memory template,
        uint256 quantity,
        uint256[] memory ingredients
    ) private returns (uint256[] memory) {
        uint256[] memory burntIngredients = new uint256[](ingredients.length);
        uint256 burntIngredientsCount = 0;
        for (uint i = 0; i < template.needed_resources.length; i++) {
            // get the current resource id from the template to create the new ressource
            uint256 neededResourceId = template.needed_resources[i];

            // calculate the needed amount of the resource
            // for example: if the template says we need 20 (20g) of beef shoulder to create a new ressource and the quantity is 5, we need 100 (100g) of beef shoulder
            uint256 neededAmount = template.needed_resources_amounts[i] *
                quantity;

            for (uint j = 0; j < ingredients.length; j++) {
                uint256 resource = ingredients[j];
                if (metaData[resource].resourceId == neededResourceId) {
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
