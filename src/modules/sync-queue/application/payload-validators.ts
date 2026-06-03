import { SyncOperation } from '../domain/entities/sync-queue.entity';

// Erreur métier levée avant toute écriture en base
export class PayloadValidationError extends Error {
  constructor(entityType: string, field: string, reason: string) {
    super(`[${entityType}] Payload invalide — champ "${field}" : ${reason}`);
    this.name = 'PayloadValidationError';
  }
}

type Payload = Record<string, unknown>;

function assertField(payload: Payload, field: string, entityType: string): void {
  const value = payload[field];
  if (value === undefined || value === null || value === '') {
    throw new PayloadValidationError(entityType, field, 'champ requis manquant ou vide');
  }
}

function assertPositiveNumber(payload: Payload, field: string, entityType: string): void {
  assertField(payload, field, entityType);
  const n = Number(payload[field]);
  if (isNaN(n) || n < 0) {
    throw new PayloadValidationError(entityType, field, 'doit être un nombre >= 0');
  }
}
// ── Validateurs par entité ────────────────────────────────────────
function validateSale(op: SyncOperation, payload: Payload): void {
  if (op === SyncOperation.CREATE) {
    assertField(payload, 'shopId', 'Sale');
    assertField(payload, 'userId', 'Sale');
    assertField(payload, 'receiptNumber', 'Sale');
    assertPositiveNumber(payload, 'totalAmount', 'Sale');

    const items = payload['items'];
    if (!Array.isArray(items) && payload['itemsCount'] === undefined) {
      // Les items peuvent être absents si la vente n'en a pas (ticket annulé)
      // mais totalAmount doit être cohérent
    }
    if (Number(payload['totalAmount']) < 0) {
      throw new PayloadValidationError('Sale', 'totalAmount', 'ne peut pas être négatif');
    }
  }
}

function validateProduct(op: SyncOperation, payload: Payload): void {
  if (op === SyncOperation.CREATE) {
    assertField(payload, 'shopId', 'Product');
    assertField(payload, 'name', 'Product');
    assertPositiveNumber(payload, 'sellingPrice', 'Product');
    assertPositiveNumber(payload, 'buyingPrice', 'Product');
  }
  if (op === SyncOperation.UPDATE) {
    if (payload['sellingPrice'] !== undefined) {
      assertPositiveNumber(payload, 'sellingPrice', 'Product');
    }
    if (payload['buyingPrice'] !== undefined) {
      assertPositiveNumber(payload, 'buyingPrice', 'Product');
    }
  }
}

function validateCustomer(op: SyncOperation, payload: Payload): void {
  if (op === SyncOperation.CREATE) {
    assertField(payload, 'name', 'Customer');
  }
}
function validateExpense(op: SyncOperation, payload: Payload): void {
  if (op === SyncOperation.CREATE) {
    assertField(payload, 'shopId', 'Expense');
    assertField(payload, 'title', 'Expense');
    assertField(payload, 'category', 'Expense');
    assertPositiveNumber(payload, 'amount', 'Expense');
  }
}

function validateCashSession(op: SyncOperation, payload: Payload): void {
  if (op === SyncOperation.CREATE) {
    assertField(payload, 'shopId', 'CashSession');
    assertField(payload, 'userId', 'CashSession');
    assertPositiveNumber(payload, 'openingBalance', 'CashSession');
  }
}

function validateStockMovement(op: SyncOperation, payload: Payload): void {
  if (op === SyncOperation.CREATE) {
    assertField(payload, 'productId', 'StockMovement');
    assertField(payload, 'shopId', 'StockMovement');
    assertField(payload, 'userId', 'StockMovement');
    assertField(payload, 'reason', 'StockMovement');
    assertField(payload, 'quantity', 'StockMovement');
    assertPositiveNumber(payload, 'stockBefore', 'StockMovement');
    assertPositiveNumber(payload, 'stockAfter', 'StockMovement');
  }
}

function validatePurchaseOrder(op: SyncOperation, payload: Payload): void {
  if (op === SyncOperation.CREATE) {
    assertField(payload, 'shopId', 'PurchaseOrder');
    assertField(payload, 'supplierId', 'PurchaseOrder');
    assertField(payload, 'orderNumber', 'PurchaseOrder');
    assertPositiveNumber(payload, 'totalAmount', 'PurchaseOrder');
  }
}

function validateCreditPayment(op: SyncOperation, payload: Payload): void {
  if (op === SyncOperation.CREATE) {
    assertField(payload, 'customerId', 'CreditPayment');
    assertField(payload, 'method', 'CreditPayment');
    assertPositiveNumber(payload, 'amount', 'CreditPayment');
    if (Number(payload['amount']) <= 0) {
      throw new PayloadValidationError('CreditPayment', 'amount', 'doit être > 0');
    }
  }
}

function validateStockTransfer(op: SyncOperation, payload: Payload): void {
  if (op === SyncOperation.CREATE) {
    assertField(payload, 'fromShopId', 'StockTransfer');
    assertField(payload, 'toShopId', 'StockTransfer');
    assertField(payload, 'transferNumber', 'StockTransfer');
    if (payload['fromShopId'] === payload['toShopId']) {
      throw new PayloadValidationError('StockTransfer', 'toShopId', 'la boutique source et destination ne peuvent pas être identiques');
    }
  }
}

// ── Point d'entrée unique ─────────────────────────────────────────

export function validateSyncPayload(
  entityType: string,
  operation: SyncOperation,
  payload: Payload,
): void {
  switch (entityType) {
    case 'Sale':          return validateSale(operation, payload);
    case 'Product':       return validateProduct(operation, payload);
    case 'Customer':      return validateCustomer(operation, payload);
    case 'Expense':       return validateExpense(operation, payload);
    case 'CashSession':   return validateCashSession(operation, payload);
    case 'StockMovement': return validateStockMovement(operation, payload);
    case 'PurchaseOrder': return validatePurchaseOrder(operation, payload);
    case 'CreditPayment': return validateCreditPayment(operation, payload);
    case 'StockTransfer': return validateStockTransfer(operation, payload);
    default:
      throw new Error(`entityType non supporté par le validateur: "${entityType}"`);
  }
}
