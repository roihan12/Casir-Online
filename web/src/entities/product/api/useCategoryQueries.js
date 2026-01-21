import { useQuery } from '@tanstack/react-query';
import categoryApi from '@shared/api/categoryApi';

export const categoryKeys = {
  all: ['categories'],
  lists: () => [...categoryKeys.all, 'list'],
};

export const useCategories = (options = {}) => {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () => categoryApi.getAll(),
    ...options,
  });
};
