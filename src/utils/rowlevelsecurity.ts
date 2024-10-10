import {
  IHeaders,
  IRowLevelSecurity,
  IRowLevelSecurityFromSuperset,
} from './interface';
import { fetchRequest, initRequest, postRequest } from './superset';

export const generateRowLevelSecurity = (
  roles: number[],
  groupKey: string,
  placeCode: string,
  tables: string,
  userType: string,
  zone?: string,
) => {
  if (zone) {
    return {
      clause: `${groupKey}='${placeCode}' AND zone = '${zone}'`,
      description: '',
      filter_type: `Regular`,
      group_key: groupKey,
      name: `${userType}-${placeCode}_zone-${zone}`,
      roles: roles,
      tables: JSON.parse(tables),
    };
  } else {
    return {
      clause: `${groupKey}='${placeCode}'`,
      description: '',
      filter_type: `Regular`,
      group_key: groupKey,
      name: `${userType}-${placeCode}`,
      roles: roles,
      tables: JSON.parse(tables),
    };
  }
};

export const getAvailableRowlevelSecurityFromSuperset = async (
  authorizationHeaders: IHeaders,
): Promise<{ result: IRowLevelSecurityFromSuperset[] }> => {
  const method = 'GET';
  const endpoint = `/rowlevelsecurity/`;
  const request = initRequest(method, authorizationHeaders);
  return await fetchRequest(endpoint, request);
};

export const createRowlevelSecurity = async (
  rowlevelsecurity: IRowLevelSecurity,
  headers: IHeaders,
) => {
  try {
    const response = await postRequest(
      headers,
      `/rowlevelsecurity/`,
      rowlevelsecurity,
    );

    return response;
  } catch (error) {
    console.error('Error creating user rowlevel security:', error);
  }
};
