import React, { useState, useRef, useEffect } from 'react';
import './SelectInput.css';

/**
 * 通用的下拉式選單組件
 * @param {string} label - 欄位的標籤名稱
 * @param {string} value - 當前選中的值
 * @param {function} onChange - 值改變時的處理函數
 * @param {Array<object>} options - 選項列表，格式為 [{ value: '...', label: '...' }] 
 */
const SelectInput = ({ label, value, onChange, options, name, disabled = false, style = {} }) => {
  const [expanded, setExpanded] = useState(false);
  const dropdownRef = useRef(null);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };

    if (expanded) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [expanded]);

  const handleOptionClick = (optionValue) => {
    const syntheticEvent = {
      target: {
        value: optionValue,
        name: name
      }
    };
    onChange(syntheticEvent);
    setExpanded(false);
  };

  // 獲取當前選中的標籤
  const selectedLabel = options.find(opt => opt.value === value)?.label || `請選擇${label}`;

  return (
    <div
      ref={dropdownRef}
      className="select-input-container"
      style={style}
    >
      {/* 按鈕 */}
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        className="select-input-button"
      >
        <span>{selectedLabel}</span>
        <svg
          className={`select-input-icon ${expanded ? 'expanded' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </button>

      {/* 下拉選單 */}
      <ul className={`select-input-dropdown ${expanded ? 'expanded' : ''}`}>
        {options.map((option, index) => (
          <li key={option.value} style={{ listStyle: 'none' }}>
            <a
              onClick={() => handleOptionClick(option.value)}
              className={`select-input-item ${value === option.value ? 'active' : ''}`}
              style={{
                borderRadius: index === 0 ? '4px 4px 0 0' : index === options.length - 1 ? '0 0 4px 4px' : '0',
              }}
            >
              {option.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SelectInput;
