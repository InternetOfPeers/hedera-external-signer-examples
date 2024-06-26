// @ts-nocheck
import axios from "axios";
import {
  AccountBalance,
  AccountBalanceQuery,
  TransactionReceiptQuery,
  AccountId,
  AccountInfo,
  AccountInfoQuery,
  AccountRecordsQuery,
  Hbar,
  LedgerId,
  PublicKey,
  Transaction,
  TransactionId,
  TransactionReceipt,
  TransactionResponse,
  TransferTransaction,
  TokenCreateTransaction,
  TokenType,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

const instance = axios.create({
  baseURL: "http://127.0.0.1:3000/",
});

/**
 * @template RequestT
 * @template ResponseT
 * @template OutputT
 * @typedef {import("@hashgraph/sdk").Executable<RequestT, ResponseT, OutputT>} Executable<RequestT, ResponseT, OutputT>
 */

/**
 * @typedef {import("@hashgraph/sdk").Signer} Signer
 * @typedef {import("@hashgraph/sdk").Provider} Provider
 * @typedef {import("@hashgraph/sdk").TransactionResponseJSON} TransactionResponseJSON
 * @typedef {import("@hashgraph/sdk").Key} Key
 * @typedef {import("@hashgraph/sdk").SignerSignature} SignerSignature
 * @typedef {import("@hashgraph/sdk").TransactionRecord} TransactionRecord
 */

/**
 * @typedef {object} LocalProviderResponse
 * @property {string} response
 * @property {string | undefined} error
 */

/**
 * @implements {Provider}
 */
export class SimpleRestProvider {
  /**
   * @param {LedgerId?} ledgerId
   * @param {{[key: string]: string}} network
   * @param {string[]} mirrorNetwork
   */
  constructor(ledgerId, network, mirrorNetwork) {
    this.ledgerId = ledgerId;
    this.network = network;
    this.mirrorNetwork = mirrorNetwork;
  }

  /**
   * @returns {LedgerId?}
   */
  getLedgerId() {
    return this.ledgerId;
  }

  /**
   * @returns {{[key: string]: string}}
   */
  getNetwork() {
    return this.network;
  }

  /**
   * @returns {string[]}
   */
  getMirrorNetwork() {
    return this.mirrorNetwork;
  }

  /**
   * @param {AccountId | string} accountId
   * @returns {Promise<AccountBalance>}
   */
  getAccountBalance(accountId) {
    return this.call(new AccountBalanceQuery().setAccountId(accountId));
  }

  /**
   * @param {AccountId | string} accountId
   * @returns {Promise<AccountInfo>}
   */
  async getAccountInfo(accountId) {
    return this.call(new AccountInfoQuery().setAccountId(accountId));
  }

  /**
   * @param {AccountId | string} accountId
   * @returns {Promise<TransactionRecord[]>}
   */
  getAccountRecords(accountId) {
    return this.call(new AccountRecordsQuery().setAccountId(accountId));
  }

  /**
   * @param {TransactionId | string} transactionId
   * @returns {Promise<TransactionReceipt>}
   */
  getTransactionReceipt(transactionId) {
    return this.call(
      new TransactionReceiptQuery().setTransactionId(transactionId)
    );
  }

  /**
   * @param {TransactionResponse} response
   * @returns {Promise<TransactionReceipt>}
   */
  waitForReceipt(response) {
    return this.call(
      new TransactionReceiptQuery().setTransactionId(response.transactionId)
    );
  }

  /**
   * @template RequestT
   * @template ResponseT
   * @template OutputT
   * @param {Executable<RequestT, ResponseT, OutputT>} request
   * @returns {Promise<OutputT>}
   */
  async call(request) {
    /** @type {{ response: string, error: string | undefined} | TransactionResponseJSON} */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = (
      await instance.post("/request", {
        request: Buffer.from(request.toBytes()).toString("hex"),
      })
    ).data;

    if (Object.prototype.hasOwnProperty.call(response, "error")) {
      throw new Error(/** @type {{ error: string }} */ (response).error);
    }

    if (Object.prototype.hasOwnProperty.call(response, "response")) {
      const inner = /** @type {{response: string}} */ (response).response;
      const bytes = Buffer.from(inner, "hex");

      switch (request.constructor.name) {
        case "AccountBalanceQuery":
          return AccountBalance.fromBytes(bytes);
        case "AccountInfoQuery":
          return AccountInfo.fromBytes(bytes);
        case "TransactionReceipt":
          return TransactionReceipt.fromBytes(bytes);
        case "TransactionReceiptQuery":
          return TransactionReceipt.fromBytes(bytes);
        default:
          throw new Error(
            `unrecognized request time ${request.constructor.name}`
          );
      }
    } else {
      return TransactionResponse.fromJSON(response);
    }
  }
}

/**
 * @implements {Signer}
 */
export class SimpleRestSigner {
  /**
   * @param {AccountId} accountId
   * @param {PublicKey} publicKey
   * @param {Provider} provider
   */
  constructor(accountId, publicKey, provider) {
    this.accountId = accountId;
    this.publicKey = publicKey;
    this.provider = provider;
  }

  /**
   * @param {(AccountId | string)=} accountId
   * @returns {Promise<SimpleRestSigner>}
   */
  static async connect(accountId) {
    /**
     * @type {{ accountId: string, publicKey: string, ledgerId: string, network: {[key: string]: string}, mirrorNetwork: string[], error: string | undefined }}
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = (
      await instance.post("/login", {
        accountId: accountId != null ? accountId.toString() : null,
      })
    ).data;

    if (response.error != null) {
      throw new Error(response.error);
    }

    const id = AccountId.fromString(response.accountId);
    const publicKey = PublicKey.fromString(response.publicKey);
    const ledgerId = LedgerId.fromString(response.ledgerId);
    const provider = new SimpleRestProvider(
      ledgerId,
      response.network,
      response.mirrorNetwork
    );

    return new SimpleRestSigner(id, publicKey, provider);
  }

  /**
   * @returns {Provider=}
   */
  getProvider() {
    return this.provider;
  }

  /**
   * @abstract
   * @returns {AccountId}
   */
  getAccountId() {
    return this.accountId;
  }

  /**
   * @returns {Key}
   */
  getAccountKey() {
    return this.publicKey;
  }

  /**
   * @returns {LedgerId?}
   */
  getLedgerId() {
    return this.provider == null ? null : this.provider.getLedgerId();
  }

  /**
   * @abstract
   * @returns {{[key: string]: (string | AccountId)}}
   */
  getNetwork() {
    return this.provider == null ? {} : this.provider.getNetwork();
  }

  /**
   * @abstract
   * @returns {string[]}
   */
  getMirrorNetwork() {
    return this.provider == null ? [] : this.provider.getMirrorNetwork();
  }

  /**
   * @param {Uint8Array[]} messages
   * @returns {Promise<SignerSignature[]>}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  sign(messages) {
    return Promise.reject(new Error("not implemented"));
  }

  /**
   * @returns {Promise<AccountBalance>}
   */
  getAccountBalance() {
    return this.call(new AccountBalanceQuery().setAccountId(this.accountId));
  }

  /**
   * @abstract
   * @returns {Promise<AccountInfo>}
   */
  getAccountInfo() {
    return this.call(new AccountInfoQuery().setAccountId(this.accountId));
  }

  /**
   * @abstract
   * @returns {Promise<TransactionRecord[]>}
   */
  getAccountRecords() {
    return this.call(new AccountRecordsQuery().setAccountId(this.accountId));
  }

  /**
   * @template {Transaction} T
   * @param {T} transaction
   * @returns {Promise<T>}
   */
  async signTransaction(transaction) {
    /** @type {LocalProviderResponse} */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = (
      await instance.post("/sign", {
        request: Buffer.from(transaction.toBytes()).toString("hex"),
      })
    ).data;

    if (Object.prototype.hasOwnProperty.call(response, "error")) {
      throw new Error(/** @type {{ error: string }} */ (response).error);
    }

    return /** @type {T} */ (
      Transaction.fromBytes(Buffer.from(response.response, "hex"))
    );
  }

  /**
   * @template {Transaction} T
   * @param {T} transaction
   * @returns {Promise<T>}
   */
  checkTransaction(transaction) {
    const transactionId = transaction.transactionId;
    if (
      transactionId != null &&
      transactionId.accountId != null &&
      transactionId.accountId.compare(this.accountId) != 0
    ) {
      throw new Error(
        "transaction's ID constructed with a different account ID"
      );
    }

    if (this.provider == null) {
      return Promise.resolve(transaction);
    }

    const nodeAccountIds = (
      transaction.nodeAccountIds != null ? transaction.nodeAccountIds : []
    ).map((nodeAccountId) => nodeAccountId.toString());
    const network = Object.values(this.provider.getNetwork()).map(
      (nodeAccountId) => nodeAccountId.toString()
    );

    if (
      !nodeAccountIds.reduce(
        (previous, current) => previous && network.includes(current),
        true
      )
    ) {
      throw new Error(
        "Transaction already set node account IDs to values not within the current network"
      );
    }

    return Promise.resolve(transaction);
  }

  /**
   * @template {Transaction} T
   * @param {T} transaction
   * @returns {Promise<T>}
   */
  populateTransaction(transaction) {
    transaction.setTransactionId(TransactionId.generate(this.accountId));
    const network = Object.values(this.provider.getNetwork()).map(
      (nodeAccountId) =>
        typeof nodeAccountId === "string"
          ? AccountId.fromString(nodeAccountId)
          : new AccountId(nodeAccountId)
    );
    transaction.setNodeAccountIds(network);
    return Promise.resolve(transaction);
  }

  /**
   * @template RequestT
   * @template ResponseT
   * @template OutputT
   * @param {Executable<RequestT, ResponseT, OutputT>} request
   * @returns {Promise<OutputT>}
   */
  call(request) {
    if (this.provider == null) {
      throw new Error(
        "cannot send request with an wallet that doesn't contain a provider"
      );
    }

    return this.provider.call(request);
  }
}

/**
 *
 */
async function main() {
  const signer = await SimpleRestSigner.connect();
  const provider = signer.getProvider();

  console.log("> Free query balance...");
  const balance = await signer.getAccountBalance();
  console.log(`< Balance: ${balance.hbars.toString()}`);

  console.log("> Paid query account info...");
  const info = await signer.getAccountInfo();
  console.log(`< Key: ${info.key.toString()}`);

  console.log("> Paid transfer...");
  let transaction = await new TransferTransaction()
    .addHbarTransfer("0.0.4407256", Hbar.fromTinybars(1))
    .addHbarTransfer(signer.accountId, Hbar.fromTinybars(1).negated())
    .freezeWithSigner(signer);
  let response = await transaction.executeWithSigner(signer);
  let receipt = await provider.getTransactionReceipt(transaction.transactionId);
  console.log("< Transfer successful?", receipt.status.toString() == "SUCCESS");

  console.log("> Paid token creation...");
  transaction = await new TokenCreateTransaction()
    .setTokenName("test_name")
    .setTokenSymbol("test_symbol")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyKey(PublicKey.fromString(process.env.OPERATOR_PUBLIC_KEY))
    .setTreasuryAccountId(AccountId.fromString(process.env.OPERATOR_ID))
    .setAdminKey(PublicKey.fromString(process.env.OPERATOR_PUBLIC_KEY))
    .freezeWithSigner(signer);
  response = await transaction.executeWithSigner(signer);
  receipt = await provider.getTransactionReceipt(transaction.transactionId);
  console.log("< TokenId:", receipt.tokenId.toString());
}

void main();
