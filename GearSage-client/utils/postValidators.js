const isString = (value) => typeof value === 'string';
const isArray = Array.isArray;

const getValue = (source, path) => {
  if (!path) return undefined;
  const keys = path.split('.');
  let current = source;
  for (const key of keys) {
    if (current == null) {
      return undefined;
    }
    current = current[key];
  }
  return current;
};

const applyValidator = (value, validator, formData, context) => {
  const { type, message } = validator;
  switch (type) {
    case 'required': {
      if (isString(value)) {
        const trimmed = validator.trim ? value.trim() : value;
        if (!trimmed) {
          return message;
        }
        return null;
      }
      if (isArray(value)) {
        if (!value.length) {
          return message;
        }
        return null;
      }
      if (value === undefined || value === null || value === '') {
        return message;
      }
      return null;
    }
    case 'minLength': {
      if (!isString(value)) {
        return null;
      }
      const content = validator.trim ? value.trim() : value;
      if (content.length < validator.value) {
        return message;
      }
      return null;
    }
    case 'maxLength': {
      if (!isString(value)) {
        return null;
      }
      if (value.length > validator.value) {
        return message;
      }
      return null;
    }
    case 'minItems': {
      if (!isArray(value)) {
        return null;
      }
      if (value.length < validator.value) {
        return message;
      }
      return null;
    }
    case 'maxItems': {
      if (!isArray(value)) {
        return null;
      }
      if (value.length > validator.value) {
        return message;
      }
      return null;
    }
    case 'custom': {
      if (typeof validator.validate === 'function') {
        const result = validator.validate(value, formData, context);
        if (result === true) {
          return null;
        }
        if (result === false || result == null) {
          return message;
        }
        return result;
      }
      return null;
    }
    default:
      return null;
  }
};

const runValidators = (value, validators = [], formData, context) => {
  for (const validator of validators) {
    const error = applyValidator(value, validator, formData, context);
    if (error) {
      return error;
    }
  }
  return null;
};

const validateWithRules = (formData, rules = [], context = {}) => {
  const errors = {};
  const checkedFields = new Set();

  for (const rule of rules) {
    const field = rule.field;
    if (!field) {
      continue;
    }
    checkedFields.add(field);
    const value = typeof rule.getValue === 'function'
      ? rule.getValue(formData, context)
      : getValue(formData, field);
    const error = runValidators(value, rule.validators, formData, context);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    checkedFields: Array.from(checkedFields),
  };
};

module.exports = {
  validateWithRules,
};
