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
This address is the owner of the contract.

The remaining privat keys will be used in the GUI to test. So add at your leasure.

## Deploying the contract

If you are running the contract locally make sure your hardhat network is running:

```
npx hardhat node
```

You can target any network from your Hardhat config using:

```
npx hardhat run scripts/deploy.ts --network <network>
```

By default it is going to be the local hardhat nework.

**After copy the Contract Address from the CLI into the .env file to make sure you run all subsequent scripts on the right contract.**

**Note**:  
If running locally hardhat will automatically use the test wallets of the hardhat nework.



Optionally deply run

```
npx hardhat run scripts/after_deploy.ts --network besu
```

to assign some roles to wallet addresses.

## Testing

### Unit Tests

```
npx hardhat test
```

### Test coverage

```
npx hardhat coverage
```
