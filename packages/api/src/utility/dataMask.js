/*
  *
    AuthMask: {
      id: 80,
      type: 0,
      desen_id: 1,
      mode: 'hide',
      hide_placeholder: '敏感信息',
      mask_type: 'middle',
      mask_len: 0,
      mask_start: 1,
      mask_end: 1,
      mask_replace: '*',
      DesensType: {
        id: 1,
        desen_type_name: '隐藏',
        desen_type_code: '01',
        remark: '文字显示为“该信息为敏感内容，不予显示”',
        status: 0,
        desen_char: '*',
        desen_len: -1,
        mask_type: '0'
      }
    }
  * 
  */

const { repeat } = require('lodash');
const { replace } = require('lodash/fp');

/**
 * @param {string} field
 * @param {object} authMask
 * @param {Array[]} rows
 * */
function processMask(field, authMask, rows) {
  console.log('processMask ', field, authMask);
  rows.map(row => {
    if (row[field]) {
      row[field] = dataMask(row[field], authMask);
    }
  });
}

/**
 *
 * @param {string} value
 * @param {object} authMask
 * */
function dataMask(value, authMask) {
  if (authMask.type === 0) {
    return buildinProcess(value, authMask.DesensType);
  } else if (authMask.type === 1) {
    return customProcess(value, authMask);
  }
  return value;
}

/**
 *
  DesensType: {
    id: 1,
    desen_type_name: '隐藏',
    desen_type_code: '01',
    remark: '文字显示为“该信息为敏感内容，不予显示”',
    status: 0,
    desen_char: '*',
    desen_len: -1,
    mask_type: '0' // 0 隐藏 1 两边打码 2 中间打码
  }
 * @param {string} value
 * @param {object} desenType
 * */
function buildinProcess(value, desenType) {
  switch (desenType.mask_type) {
    case '0':
      return desenType.desen_char;
    case '1':
      if (desenType.desen_len * 2 < value.length) {
        const start = value.substring(0, desenType.desen_len);
        const end = value.substring(value.length - desenType.desen_len, value.length);
        const other = value.substring(desenType.desen_len, value.length - desenType.desen_len);
        return repeat(desenType.desen_char, start.length) + other + repeat(desenType.desen_char, end.length);
      } else {
        return repeat(desenType.desen_char, value.length);
      }
    case '2':
      if (desenType.desen_len < value.length) {
        const startPosi = value.length / 2 - desenType.desen_len / 2;
        const endPosi = value.length / 2 + desenType.desen_len / 2;
        const start = value.substring(0, startPosi);
        const end = value.substring(endPosi, value.length);
        const other = value.substring(startPosi, endPosi);
        return start + repeat(desenType.desen_char, other.length) + end;
      } else {
        return repeat(desenType.desen_char, value.length);
      }
  }
  return value;
}

/**
 *
 * @param {string} value
     authMask:{ 
      id: 80,
      type: 0,
      desen_id: 1,
      mode: 'hide',
      hide_placeholder: '敏感信息',
      mask_type: 'middle', // middle, edge
      mask_len: 0,
      mask_start: 1,
      mask_end: 1,
      mask_replace: '*',
    }
 * @param {object} authMask
 * */
function customProcess(value, authMask) {
  if (authMask.mode === 'hide') {
    return authMask.hide_placeholder;
  }
  switch (authMask.mask_type) {
    case 'edge':
      if (authMask.mask_start + authMask.mask_end < value.length) {
        const start = value.substring(0, authMask.mask_start);
        const end = value.substring(value.length - authMask.mask_end, value.length);
        const other = value.substring(authMask.mask_start, value.length - authMask.mask_end);
        return repeat(authMask.mask_replace, start.length) + other + repeat(authMask.mask_replace, end.length);
      } else {
        return repeat(authMask.mask_replace, value.length);
      }
    case 'middle':
      if (authMask.mask_start < value.length) {
        const startPosi = value.length / 2 - authMask.mask_start / 2;
        const endPosi = value.length / 2 + authMask.mask_start / 2;
        const start = value.substring(0, startPosi);
        const end = value.substring(endPosi, value.length);
        const other = value.substring(startPosi, endPosi);
        return start + repeat(authMask.mask_replace, other.length) + end;
      } else {
        return repeat(authMask.mask_replace, value.length);
      }
  }
  return value;
}

module.exports = {
  processMask,
};
