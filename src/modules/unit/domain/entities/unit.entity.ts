export class Unit {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly abbreviation: string,
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getAbbreviation(): string {
    return this.abbreviation;
  }
}
