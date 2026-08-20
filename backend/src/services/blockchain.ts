import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import db from "../config/database";
import { config } from "../config";
import { BlockchainBlock } from "../types";

const TABLE = "blockchain_ledger";

export async function getLastBlock(): Promise<BlockchainBlock | null> {
  const block = await db(TABLE)
    .orderBy("issue_timestamp", "desc")
    .first();
  return block || null;
}

export async function createBlock(
  touristId: string,
  dataPayload: Record<string, unknown>
): Promise<BlockchainBlock> {
  const dataString = JSON.stringify(dataPayload);
  const dataHash = crypto
    .createHash("sha256")
    .update(dataString + config.blockchain.salt)
    .digest("hex");

  const previousBlock = await getLastBlock();
  const previousBlockHash = previousBlock
    ? previousBlock.current_block_hash
    : "0".repeat(64);

  const blockId = uuidv4();
  const issueTimestamp = new Date();
  const expiryTimestamp = new Date(dataPayload.tripEnd as string);

  const blockData = {
    block_id: blockId,
    tourist_id: touristId,
    data_hash: dataHash,
    issue_timestamp: issueTimestamp,
    expiry_timestamp: expiryTimestamp,
    previous_block_hash: previousBlockHash,
  };

  const currentBlockHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(blockData) + config.blockchain.salt)
    .digest("hex");

  const [block] = await db(TABLE)
    .insert({
      ...blockData,
      current_block_hash: currentBlockHash,
    })
    .returning("*");

  return block;
}

export async function verifyBlock(blockId: string): Promise<{
  valid: boolean;
  chainIntact: boolean;
  dataIntact: boolean;
  expired: boolean;
  block: BlockchainBlock | null;
}> {
  const block = await db(TABLE).where({ block_id: blockId }).first();
  if (!block) {
    return { valid: false, chainIntact: false, dataIntact: false, expired: false, block: null };
  }

  // Verify chain integrity: recompute current_block_hash
  const blockData = {
    block_id: block.block_id,
    tourist_id: block.tourist_id,
    data_hash: block.data_hash,
    issue_timestamp: block.issue_timestamp,
    expiry_timestamp: block.expiry_timestamp,
    previous_block_hash: block.previous_block_hash,
  };
  const recomputedHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(blockData) + config.blockchain.salt)
    .digest("hex");

  const chainIntact = recomputedHash === block.current_block_hash;

  // Walk backward to genesis to verify full chain
  let chainFullyIntact = chainIntact;
  let current = block;
  while (current.previous_block_hash !== "0".repeat(64)) {
    const prev = await db(TABLE)
      .where({ block_id: current.previous_block_hash })
      .first();
    if (!prev) {
      chainFullyIntact = false;
      break;
    }
    const prevData = {
      block_id: prev.block_id,
      tourist_id: prev.tourist_id,
      data_hash: prev.data_hash,
      issue_timestamp: prev.issue_timestamp,
      expiry_timestamp: prev.expiry_timestamp,
      previous_block_hash: prev.previous_block_hash,
    };
    const prevRecomputed = crypto
      .createHash("sha256")
      .update(JSON.stringify(prevData) + config.blockchain.salt)
      .digest("hex");
    if (prevRecomputed !== prev.current_block_hash) {
      chainFullyIntact = false;
      break;
    }
    current = prev;
  }

  // Check expiry
  const now = new Date();
  const expired = new Date(block.expiry_timestamp) < now;

  return {
    valid: chainFullyIntact && !expired,
    chainIntact: chainFullyIntact,
    dataIntact: chainIntact,
    expired,
    block,
  };
}

export async function getDataHash(dataPayload: Record<string, unknown>): Promise<string> {
  const dataString = JSON.stringify(dataPayload);
  return crypto
    .createHash("sha256")
    .update(dataString + config.blockchain.salt)
    .digest("hex");
}
