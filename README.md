# Hedera External Signature Examples

A Hedera application can outsource the signing of its transactions to an external component.

This repo contains an example where the signer is on an external server providing access via web APIs.
The client is an application creating the transaction and requesting a raw signature on the server.
The client tries four transactions: a free transaction (balance query) and three paid transactions (account query, HBAR transfer, token creation).

This example derives from the [simple REST signature provider example](https://github.com/hashgraph/hedera-sdk-js/tree/269fb78a4d4639c97115b195e65edb6ebeedeb7a/examples/simple_rest_signature_provider) you can find in the [Hedera™ Hashgraph JavaScript SDK](https://github.com/hashgraph/hedera-sdk-js) repository.

## Running the scenario

Rename `.env.example` to `.env` and fill with correct values.

Run the server with:

```sh
npm run server
```

Example output:

```sh
> hedera-external-signer@1.0.0 server
> node src/server

Listening on localhost:3000
```

Run the client with:

```sh
npm run client
```

Example output:

```sh
> hedera-external-signer@1.0.0 client
> node src/client

> Free query balance...
< Balance: 302914.69757639 ℏ
> Paid query account info...
< Key: 302a300506032b657003210097697c9a01c0274b049625fb6860a9acb2aaeb1cce5d04aeeb9fe5121131dd7a
> Paid transfer...
< Transfer successful? true
> Paid token creation...
< TokenId: 0.0.4409936
```
