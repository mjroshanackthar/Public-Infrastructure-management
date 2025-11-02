// Utility functions for error handling and data validation

export const ensureArray = (data) => {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    return Object.values(data);
  }
  return [];
};

export const safeFilter = (array, filterFn) => {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.filter(item => {
    try {
      return item && filterFn(item);
    } catch (error) {
      console.warn('Filter function error:', error);
      return false;
    }
  });
};

export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

export const handleWeb3Error = (error, defaultMessage = 'Web3 transaction failed') => {
  if (error.code === 4001) {
    return 'Transaction rejected by user';
  }
  if (error.code === -32603) {
    return 'Internal JSON-RPC error';
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};