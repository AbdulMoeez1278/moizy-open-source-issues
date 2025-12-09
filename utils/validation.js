const EMAIL_REGEX = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/


/**
 * 
 * @param {any} value 
 * @returns {object}
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined || value === '') {
    return {
      valid: false,
      message: 'this field is required'
    };
  }
  if (typeof value === 'string' && value.trim() === '') {
    return {
      valid: false,
      message: 'this field is required'
    };
  }

  return {
    valid: true,
    message: ''// Corrected "Strict" Regex

  };
};

/**
 * 
 * @param {string} email 
 * @returns {object}
 */

export const validateEmail = (email) => {
  if (!EMAIL_REGEX.test(email)) {
    return {
      valid: false,
      message: 'Please Enter a valid email address'
    }
  }

  return {
    valid: true,
    message: ''
  };
};


/**
 * 
 * @param {string} password 
 * @returns 
 */


export const validatePassword = (password) => {
  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      message: 'Plase Enter a valid Password'
    };
  }
  return {
    valid: true,
    message: ''
  };
};

/**
 * 
 * @param {number} value 
 * @returns 
 */

export const validateNumber = (value) => {
  if (isNaN(Number(value))) {
    return { valid: false, message: 'Please enter a valid number.' };
  }

  return {
    valid: true,
    message: ''
  };
};

const ruleRegistry = {

  email: validateEmail,
  password: validatePassword,
  required: validateRequired,
  number: validateNumber ,

}

/**
 * @param {any} value
 * @param {Array<string | object>} rules
 * @returns {object}
 */

export const validateField = (value, rules = []) => {
  for (const rule of rules) {
    let ruleName = rule;
    
    if (typeof rule === 'object' && rule.rule) {
      ruleName = rule.rule;
    }

    const validator = ruleRegistry[ruleName];

    if (validator) {
      const result = validator(value);
      if (!result.valid) {
        return result;
      }
    } else {
      console.warn(`Validation rule "${ruleName}" not found.`);
    }
  }

  return { valid: true, message: '' };
};

