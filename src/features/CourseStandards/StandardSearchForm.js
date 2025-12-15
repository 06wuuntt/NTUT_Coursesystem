import React from 'react';
import SelectInput from '../../components/forms/SelectInput';

const styles = {
    forms: {
        marginBottom: '20px',
        padding: '30px 50px',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
    },
    form: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
    },
};

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
        <div style={styles.forms}>
            <h3 style={{ color: '#464646', fontSize: '1.5rem', margin: '0 0 20px' }}>選擇入學年度及系所</h3>
            <div style={styles.form}>
                <SelectInput
                    label="入學年分"
                    name="year"
                    value={selectedYear}
                    onChange={onChange}
                    options={yearOptions}
                />

                {loadingOptions ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#3B82F6', padding: '20px' }}>
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
