export class Document {
  constructor(
    public readonly id: string,
    public readonly displayName: string,
    public readonly fileName: string,
    public readonly mimeType: string,
    public readonly sizeBytes: number,
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly uploadedByName: string,
    public readonly assignAllRoles: boolean = false,
    public readonly roleIds: string[] = [],
    public readonly createdAt: Date = new Date(),
  ) {}
}