/**
 * Batch persistence — thin, parameterized-SQL repository.
 *
 * All reads/writes go through here; screens never build SQL. Queries use
 * bound parameters only (no string concatenation of user input). The
 * repository reuses the already-validated CreateBatchInput — the form
 * validator and the schema CHECK constraints are the trust boundaries.
 */
import type { Batch, CreateBatchInput } from '../domain/batch';
import { uuidV4 } from '../utils/uuid';
import { rowToBatch, type BatchRow } from './db/batchMappers';
import { getDatabase } from './db/database';

const INSERT_BATCH_SQL = `
  INSERT INTO batches
    (id, name, poultry_type, initial_bird_count, start_date, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

/** Inserts a new batch as `active`. Returns the persisted row (ids/timestamps added here). */
export async function insertBatch(input: CreateBatchInput): Promise<Batch> {
  const now = new Date().toISOString();
  const batch: Batch = {
    id: uuidV4(),
    ...input,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDatabase();
  await db.runAsync(INSERT_BATCH_SQL, [
    batch.id,
    batch.name,
    batch.poultryType,
    batch.initialBirdCount,
    batch.startDate,
    batch.status,
    batch.createdAt,
    batch.updatedAt,
  ]);

  return batch;
}

/** Newest batches first. */
export async function listBatches(): Promise<readonly Batch[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BatchRow>('SELECT * FROM batches ORDER BY created_at DESC');
  return rows.map(rowToBatch);
}

export async function getBatchById(id: string): Promise<Batch | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<BatchRow>('SELECT * FROM batches WHERE id = ?', [id]);
  return row === null ? null : rowToBatch(row);
}
