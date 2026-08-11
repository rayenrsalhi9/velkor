export const WILDCARD_CLAIM = "*";

export interface ClaimDefinition {
  key: string;
  label: string;
  description: string;
  module: string;
  dependsOn?: string[];
}

export const CLAIMS_CATALOG: ClaimDefinition[] = [
  {
    key: "documents:view-list",
    label: "View documents list",
    description: "See the list of all documents",
    module: "Documents",
  },
  {
    key: "documents:view-assigned",
    label: "View assigned documents",
    description: "See documents assigned to the user",
    module: "Documents",
  },
  {
    key: "documents:view-categories",
    label: "View document categories",
    description: "See document categories",
    module: "Documents",
  },
  {
    key: "documents:upload",
    label: "Upload documents",
    description: "Upload new documents",
    module: "Documents",
  },
  {
    key: "documents:edit",
    label: "Edit documents",
    description: "Edit document metadata and contents",
    module: "Documents",
  },
  {
    key: "documents:delete",
    label: "Delete documents",
    description: "Delete documents",
    module: "Documents",
  },
  {
    key: "categories:manage",
    label: "Manage document categories",
    description: "Create, edit, and delete document categories",
    dependsOn: ["documents:view-categories"],
    module: "Documents",
  },
  {
    key: "users:manage",
    label: "Manage users",
    description: "Create, edit, and delete user accounts",
    module: "Administration",
    dependsOn: ["roles:manage"],
  },
  {
    key: "roles:manage",
    label: "Manage roles",
    description: "Create, edit, and delete roles and their claims",
    module: "Administration",
  },
];
