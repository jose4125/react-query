import jsonpatch from 'fast-json-patch';
import { UseMutateFunction, useMutation, useQueryClient } from 'react-query';
import { queryKeys } from 'react-query/constants';

import type { User } from '../../../../../shared/types';
import { axiosInstance, getJWTHeader } from '../../../axiosInstance';
import { useCustomToast } from '../../app/hooks/useCustomToast';
import { useUser } from './useUser';

// for when we need a server function
async function patchUserOnServer(
  newData: User | null,
  originalData: User | null,
): Promise<User | null> {
  if (!newData || !originalData) return null;
  // create a patch for the difference between newData and originalData
  const patch = jsonpatch.compare(originalData, newData);

  // send patched data to the server
  const { data } = await axiosInstance.patch(
    `/user/${originalData.id}`,
    { patch },
    {
      headers: getJWTHeader(originalData),
    },
  );
  return data.user;
}

// TODO: update type to UseMutateFunction type
export function usePatchUser(): UseMutateFunction<
  User,
  unknown,
  User,
  unknown
> {
  const { user, updateUser } = useUser();
  const toast = useCustomToast();
  const queryClient = useQueryClient();

  // TODO: replace with mutate function
  const { mutate: patchUser } = useMutation(
    (newUserData: User | null) => patchUserOnServer(newUserData, user),
    {
      onMutate: async (newUserData: User | null) => {
        queryClient.cancelQueries(queryKeys.user);

        const previousUserData: User = queryClient.getQueryData(queryKeys.user);
        updateUser(newUserData);
        return { previousUserData };
      },
      onError: (error, newData, previousUserDataContext) => {
        if (previousUserDataContext.previousUserData) {
          updateUser(previousUserDataContext.previousUserData);
          toast({
            title: 'Update failed, restoring previews values',
            status: 'warning',
          });
        }
      },
      onSuccess: (userData) => {
        if (userData) {
          updateUser(userData);
          toast({
            title: 'user updated!',
            status: 'success',
          });
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries(queryKeys.user);
      },
    },
  );

  return patchUser;
}
