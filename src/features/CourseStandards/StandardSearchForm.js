import React from 'react';
import SelectInput from '../../components/forms/SelectInput';
import './StandardSearchForm.css';

const StandardSearchForm = ({
    selectedYear,
    selectedProgram,
    selectedDeptId,
    yearOptions,
    programOptions,
    departmentOptions,
    loadingOptions,
    onChange
}) => {
    return (
        <div className="standard-search-form-container">
            <h3 className="standard-search-form-title">選擇入學年度及系所</h3>
            <div className="standard-search-form-grid">
                <SelectInput
                    label="入學年分"
                    name="year"
                    value={selectedYear}
                    onChange={onChange}
                    options={yearOptions}
                />

                {loadingOptions ? (
                    <div className="standard-search-loading">
                        正在載入系所選項...
                    </div>
                ) : (
                    <>
                        <SelectInput
                            label="學程"
                            name="program"
                            value={selectedProgram}
                            onChange={onChange}
                            options={programOptions}
                            disabled={!selectedYear}
                        />

                        <SelectInput
                            label="系所"
                            name="department"
                            value={selectedDeptId}
                            onChange={onChange}
                            options={departmentOptions
                                .filter(d => !selectedProgram || String(d.value).startsWith(`${selectedProgram}-`))
                                .map(d => ({
                                    value: d.value,
                                    label: String(d.label).replace(/\s*\(.+\)\s*$/, '')
                                }))}
                            disabled={!selectedYear}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default StandardSearchForm;
