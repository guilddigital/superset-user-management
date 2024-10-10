import { CHA_TABLES } from './config/config';
import { IHeaders, IRowLevelSecurityFromSuperset } from './utils/interface';
import {
  addPermissionsForUserRole,
  getUserPermissions,
} from './utils/permissions';
import {
  SupersetRole,
  createUserRole,
  generatePermissions,
  generateRole,
} from './utils/role';
import {
  getAvailableRowlevelSecurityFromSuperset,
  generateRowLevelSecurity,
  createRowlevelSecurity,
} from './utils/rowlevelsecurity';
import { CSVUser, createUserAccount, generateUser } from './utils/user';

export const bulkUserUploadUg = async (
  users: CSVUser[],
  rolesAvailableOnSuperset: SupersetRole[],
  headers: IHeaders,
) => {
  const userPermissions = await getUserPermissions(
    rolesAvailableOnSuperset,
    headers,
  );
  const { result: rowLevelFromSuperset } =
    await getAvailableRowlevelSecurityFromSuperset(headers);
  for (const user of users) {
    let userRole: SupersetRole;
    // pass zone as null if not applicable
    const generatedRole = generateRole(user.role, user.place);

    const existingRoleOnSuperset = rolesAvailableOnSuperset.find(
      (ssrole: { id: number; name: string }) =>
        ssrole.name === generatedRole.name,
    );

    if (existingRoleOnSuperset) {
      userRole = existingRoleOnSuperset;
    } else {
      userRole = await createUserRole(generatedRole, headers);
      rolesAvailableOnSuperset.push({
        id: userRole.id,
        name: userRole.name,
      });
    }

    const rolePermissions = generatePermissions(userPermissions);
    console.log('================');
    console.log(userPermissions);
    console.log(rolePermissions);
    console.log('================');
    await addPermissionsForUserRole(userRole.id, rolePermissions, headers);

    const generatedUser = generateUser(user, [userRole.id]);
    await createUserAccount(generatedUser, headers);

    const rowLevelSecurity = generateRowLevelSecurity(
      [userRole.id],
      user!.group,
      user.place,
      CHA_TABLES,
      user.role,
    );
    console.log(rowLevelFromSuperset);
    console.log(rowLevelSecurity.name);
    const doesRowLevelExist = rowLevelFromSuperset.some(
      (level: any) => level?.name === rowLevelSecurity.name,
    );
    console.log(doesRowLevelExist);

    if (!doesRowLevelExist) {
      console.log('==================');
      console.log(rowLevelSecurity.name);
      console.log('==================');
      const response = await createRowlevelSecurity(
        { ...rowLevelSecurity, description: '' },
        { ...headers },
      );
      rowLevelFromSuperset.push(response);
    }
  }
};
