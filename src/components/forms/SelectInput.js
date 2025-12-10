import React from 'react';

/**
 * 通用的下拉式選單組件
 * @param {string} label - 欄位的標籤名稱
 * @param {string} value - 當前選中的值
 * @param {function} onChange - 值改變時的處理函數
 * @param {Array<object>} options - 選項列表，格式為 [{ value: '...', label: '...' }]
 */
const SelectInput = ({ label, value, onChange, options, name }) => {
  const styles = {
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
    },
    select: {
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      width: '100%',
      boxSizing: 'border-box',
    },
  };

  return (
    <div style={styles.container}>
      {/* <label htmlFor={name} style={styles.label}>{label}</label> */}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        style={styles.select}
      >
        <option value="" disabled>請選擇{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectInput;