export type Role = "manager" | "reader" | "owner" | "member";

export type InviteRole = Exclude<Role, "owner">;

export interface MemberProps {
  email?: string;
  name: string;
  role: Role;
  user_id: string;
}

export interface OptionRoles {
  label: string;
  value: string | Role;
}

export interface DetailsProps {
  id: string;
  name: string;
}

export interface OrganizationListProps extends DetailsProps {
  role: Role;
  members: MemberProps[];
}

export interface UserOrganizationProps extends DetailsProps {
  created_at?: string;
  owner_user_id?: string;
  public_id?: string;
}

export interface UserOrganizationsProps {
  organization: UserOrganizationProps;
  role: Role;
}
