export class ProductComponent {
  constructor(
    private readonly id: string,
    private readonly composedId: string,
    private readonly componentId: string,
    private readonly quantity: number,
    private readonly componentName?: string,
    private readonly componentBarcode?: string | null,
  ) {}

  getId(): string { return this.id; }
  getComposedId(): string { return this.composedId; }
  getComponentId(): string { return this.componentId; }
  getQuantity(): number { return this.quantity; }
  getComponentName(): string | undefined { return this.componentName; }
  getComponentBarcode(): string | null | undefined { return this.componentBarcode; }
}
