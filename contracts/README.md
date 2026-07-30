# LiquidFlow smart contracts

The `contracts` directory is a Cargo workspace for LiquidFlow's Soroban
contracts. Run the commands below from this directory unless noted otherwise.

## Prerequisites

- The latest stable [Rust toolchain](https://www.rust-lang.org/tools/install),
  including Cargo and rustup.
- The WebAssembly target used by this repository and its contract CI:

  ```bash
  rustup target add wasm32-unknown-unknown
  ```

- The [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)
  (formerly Soroban CLI) for deployment. It is not required to build or test.

Check the tools before continuing:

```bash
rustc --version
cargo --version
stellar --version
```

## Build

From the repository root:

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

The stream contract Wasm is written to:

```text
contracts/target/wasm32-unknown-unknown/release/stream_contract.wasm
```

## Test

Run the workspace test suite:

```bash
cd contracts
cargo test
```

Before opening a pull request, run the same additional checks used by contract
CI:

```bash
cargo fmt -- --check
cargo clippy --all-targets -- -D warnings
```

## Deploy to testnet

Deployment is a state-changing network action. Use a funded testnet identity
that is already configured in Stellar CLI; do not commit its secret key. The
[Stellar testnet deployment guide](https://developers.stellar.org/docs/build/smart-contracts/getting-started/deploy-to-testnet)
explains how to create and fund an identity.

Build the Wasm first, then run this from `contracts` after replacing
`<identity>` with the local Stellar CLI identity name:

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stream_contract.wasm \
  --source-account <identity> \
  --network testnet \
  --alias stream_contract
```

The command returns the deployed contract ID. The alias is stored in the local
Stellar CLI configuration for later commands; it does not belong in source
control.

## Workspace layout

- `Cargo.toml` defines the Cargo workspace and shared Soroban SDK version.
- `Cargo.lock` pins the resolved Rust dependencies.
- `stream_contract/` contains the payment-stream contract and its tests.
- `target/` contains generated build artifacts and is ignored by Git.
