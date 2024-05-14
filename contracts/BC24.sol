// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

contract BC24 is ERC1155, ERC1155Burnable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Event to log the minting of a new ressource
    event RessourceEvent(
        string action,
        uint256 tokenId,
        string ressourceName,
        string message
    );

    // Holds the metadata of a ressource
    // data: the metadata of the ressource in string format
    // ressourceName: the name of the ressource. Automattically taken from the template
    // usedToCreate: an array of the tokenIds used to create this ressource (TRACABILITY OF EXACT TOKENS USED TO CREATE A NEW ONE)

    struct MetaData {
        string data;
        string ressourceName;
        uint256[] usedToCreate;
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
    }

    // ResourceId to ResourceTemplate mapping
    mapping(uint256 => ResourceTemplate) public ressourceTemplates;

    // TokenId to MetaData mapping
    mapping(uint256 => MetaData) public metaData;

    // TokenId to Owner mapping
    mapping(uint256 => address) public tokenOwners;

    // ResourceId to TokenId mapping
    // This is needed if we want to know which tokens are of a certain type in the minining and bruning process
    mapping(uint => uint[]) public tokensByResourceType;

    // TokenId counter
    uint256 tokenId = 1;

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
    }

    function getMetaData(uint256 id) public view returns (MetaData memory) {
        return metaData[id];
    }

    function mintRessource(
        uint256 resourceId,
        uint256 quantity,
        string memory _metaData
    ) public {
        // Check if the ressourceId is valid and an actual ressource can be created from it
        require(
            ressourceTemplates[resourceId].ressource_id != 0 &&
                keccak256(
                    abi.encodePacked(
                        ressourceTemplates[resourceId].ressource_name
                    )
                ) !=
                keccak256(abi.encodePacked("")),
            "Resource does not seem to exists in the system. Please check the id and try again. Otherwise contact the admin to add a new ressource to the system."
        );

        // Get the actual ressource template
        ResourceTemplate storage resourceTemplate = ressourceTemplates[
            resourceId
        ];

        // Check if the caller has the right to mint the ressource
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(
                    keccak256(abi.encode(resourceTemplate.required_role)),
                    msg.sender
                ),
            "Caller does not have the right to use the process"
        );

        // Check if the caller has the required resources to mint the ressource
        require(
            hasResourcesToMintItem(resourceTemplate, quantity),
            "You do not have the required ressources to perform this action."
        );

        // Burn the resources needed to mint the ressource
        _burnResources(resourceTemplate, quantity);

        // Mint the new ressource
        // The amount of the ressource minted is the initialAmountFromTemplate * quantity
        // For example: A template for a beef shoulder with initialAmountFromTemplate = 20000 (20kg) and quantity = 5 will mint 100000 (100kg) worth of the beef shoulder ressources
        _mint(
            msg.sender,
            tokenId,
            resourceTemplate.initialAmountFromTemplate * quantity,
            ""
        );

        // Create the unique metadata for each newly minted resource
        MetaData storage meta = metaData[tokenId];
        meta.data = _metaData;
        meta.ressourceName = resourceTemplate.ressource_name;

        // Update the tokenOwners mapping
        tokenOwners[tokenId] = msg.sender;
        // Add the tokenId to the resource type mapping
        tokensByResourceType[resourceId].push(tokenId);

        // Emit the ResourceEvent
        emit RessourceEvent(
            "Minted",
            tokenId,
            meta.ressourceName,
            "Ressource minted successfully"
        );

        tokenId++;
    }

    function hasResourcesToMintItem(
        ResourceTemplate memory template,
        uint256 quantity
    ) public view returns (bool) {
        bool returnValue = true;
        for (uint i = 0; i < template.ressources_needed.length; i++) {
            // get the needed resource ids from the template to create the new ressource
            uint256 neededResourceId = template.ressources_needed[i];
            string storage neededResourceName = ressourceTemplates[
                neededResourceId
            ].ressource_name;

            //get all tokens of the current resource type
            uint256[] memory allResourcesOfType = tokensByResourceType[
                neededResourceId
            ];

            // count all the available quantities of the resources that actually belong to the user
            uint256 totalAvailable = 0;
            for (uint j = 0; j < allResourcesOfType.length; j++) {
                totalAvailable += balanceOf(msg.sender, allResourcesOfType[j]);
            }
            // if the user does not have enough resources to mint the new ressource, return false
            if (
                totalAvailable <
                template.ressources_needed_amounts[i] * quantity
            ) {
                returnValue = false;
            }
        }
        return returnValue;
    }

    function _burnResources(
        ResourceTemplate memory template,
        uint256 quantity
    ) public {
        for (uint i = 0; i < template.ressources_needed.length; i++) {
            // get the current resource id from the template to create the new ressource
            uint256 neededResourceId = template.ressources_needed[i];

            // calculate the needed amount of the resource
            // for example: if the template says we need 20 (20g) of beef shoulder to create a new ressource and the quantity is 5, we need 100 (100g) of beef shoulder
            uint256 amountToBurn = template.ressources_needed_amounts[i] *
                quantity;

            // get all tokens of the current resource type
            uint256[] memory allResourcesOfType = tokensByResourceType[
                neededResourceId
            ];

            for (uint j = 0; j < allResourcesOfType.length; j++) {
                // check current resource balance
                uint256 resource = allResourcesOfType[j];
                uint256 availableAmount = balanceOf(msg.sender, resource);

                //if enough resources to burn just burn them and break the loop
                if (availableAmount >= amountToBurn) {
                    _burn(msg.sender, resource, amountToBurn);
                    amountToBurn -= amountToBurn;
                    // TRACEABILITY: add the used resources to the metadata of the newly created resource
                    MetaData storage meta = metaData[tokenId];
                    meta.usedToCreate.push(resource);
                    break;
                }
                // else just burn what is left for that resource and update amountToBurn
                else {
                    _burn(msg.sender, resource, availableAmount);
                    amountToBurn -= availableAmount;
                    // TRACEABILITY: add the used resources to the metadata of the newly created resource
                    MetaData storage meta = metaData[tokenId];
                    meta.usedToCreate.push(resource);
                }
            }
        }
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, ERC1155) returns (bool) {}
}
