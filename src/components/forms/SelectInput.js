import React, { useState, useRef, useEffect } from 'react';

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

  const styles = {
    container: {
      position: 'relative',
      display: 'inline-block',
      width: '100%',
      ...style
    },
    button: {
      backgroundColor: '#EDEEF1',
      color: '#464646',
      fontWeight: '600',
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'background-color 0.2s',
    },
    buttonHover: {
      backgroundColor: '#d2d2d2ff',
    },
    dropdownMenu: {
      position: 'absolute',
      backgroundColor: 'white',
      minWidth: '100%',
      maxHeight: '250px',
      overflowY: 'auto',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      padding: 0,
      margin: '4px 0 0 0',
      zIndex: 1000,
      display: expanded ? 'block' : 'none',
      top: '100%',
      left: 0,
    },
    menuItem: {
      backgroundColor: '#EDEEF1',
      color: '#464646',
      padding: '8px 16px',
      textDecoration: 'none',
      display: 'block',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      borderBottom: '1px solid #e0e0e0',
    },
    menuItemHover: {
      backgroundColor: '#d2d2d2ff',
    },
    menuItemActive: {
      backgroundColor: '#d3d3d3ff',
      fontWeight: '600',
    },
    svg: {
      fill: 'currentColor',
      height: '16px',
      width: '16px',
      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s',
    }
  };

  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div
      ref={dropdownRef}
      style={styles.container}
    >
      {/* 按鈕 */}
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        style={{
          ...styles.button,
          ...(hoveredIndex === -1 && !disabled ? styles.buttonHover : {})
        }}
        onMouseEnter={() => !disabled && setHoveredIndex(-1)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <span>{selectedLabel}</span>
        <svg
          style={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </button>

      {/* 下拉選單 */}
      <ul style={styles.dropdownMenu}>
        {options.map((option, index) => (
          <li key={option.value} style={{ listStyle: 'none' }}>
            <a
              onClick={() => handleOptionClick(option.value)}
              style={{
                ...styles.menuItem,
                borderRadius: index === 0 ? '4px 4px 0 0' : index === options.length - 1 ? '0 0 4px 4px' : '0',
                borderBottom: index === options.length - 1 ? 'none' : '1px solid #e0e0e0',
                ...(hoveredIndex === index ? styles.menuItemHover : {}),
                ...(value === option.value ? styles.menuItemActive : {})
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
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