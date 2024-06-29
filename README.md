# BC24 Smart Traceability Contract

## Presentation

The project revolves around the BC24-Contract, a Solidity smart contract designed for managing resources on a private Ethereum blockchain.

## Installing dependencies

```
npm install
```

## Pre deployment

Copy the `.env-template` and rename it to `.env`

Make sure to add at least the admin private key before deplying the contract.

## Templates

Resource templates `resource_templates/templates.ts` need to be provided at contract construction time.

Please refer to the project documentation to learn more about the clear structuring and possible usecases.

## Deploying the contract

If you are running the contract locally make sure your hardhat network is running:

```
npx hardhat node
```

You can target any network from your Hardhat config using:

```
npx hardhat run scripts/deploy.ts --network <network>
```

If you are not providing any `--network` flag, the default is going to be the local hardhat nework.

**After copy the Contract Address from the CLI into the .env file to make sure you run all subsequent scripts on the right contract.**

**Note**:  
If running locally hardhat will automatically use the test wallets of the hardhat nework.

Optionally run after_deploy which will set up some initial roles.

```
npx hardhat run scripts/after_deploy.ts --network <network>
```

## Testing

### Unit Tests

```
npx hardhat test
```

### Test coverage

```
npx hardhat coverage
```
