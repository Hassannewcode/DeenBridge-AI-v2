import React, { useState, useEffect } from 'react';
import { GREGORIAN_MONTHS, HIJRI_MONTHS } from '../../data/calendars';
import { SwitchHorizontalIcon } from './icons';
import { useLocale } from '../../contexts/LocaleContext';

interface Dob {
    day: string;
    month: string;
    year: string;
    calendar: 'gregorian' | 'hijri';
}

interface DobInputProps {
    value: Dob | null;
    onChange: (value: Dob) => void;
    onClear?: () => void;
}

const DobInput: React.FC<DobInputProps> = ({ value, onChange, onClear }) => {
    const { t } = useLocale();
    const dob = value || { day: '', month: '', year: '', calendar: 'gregorian' };
    const calendar = dob.calendar;
    
    const [age, setAge] = useState('');
    const [inputMode, setInputMode] = useState<'age' | 'year'>(dob.calendar === 'hijri' ? 'year' : 'age');

    const currentGregorianYear = new Date().getFullYear();
    const currentHijriYear = Math.round(currentGregorianYear - (currentGregorianYear - 622) * 32 / 33);

    useEffect(() => {
        // When calendar type changes, set the preferred input mode
        setInputMode(dob.calendar === 'hijri' ? 'year' : 'age');
    }, [dob.calendar]);

    useEffect(() => {
        // When value prop changes (e.g., loaded from storage), update age field
        if (dob.year) {
            const birthYear = parseInt(dob.year, 10);
            if (!isNaN(birthYear)) {
                const currentYear = dob.calendar === 'gregorian' ? currentGregorianYear : currentHijriYear;
                const calculatedAge = currentYear - birthYear;
                setAge(calculatedAge > 0 ? String(calculatedAge) : '');
            }
        } else {
            setAge('');
        }
    }, [value, dob.calendar, currentGregorianYear, currentHijriYear]);

    const handleDobPartChange = (part: keyof Dob, val: string) => {
        const newDob = { ...dob, [part]: val };
        onChange(newDob);

        if (part === 'year' && val) {
            const birthYear = parseInt(val, 10);
            if (!isNaN(birthYear)) {
                const currentYear = newDob.calendar === 'gregorian' ? currentGregorianYear : currentHijriYear;
                const calculatedAge = currentYear - birthYear;
                setAge(calculatedAge > 0 ? String(calculatedAge) : '');
            }
        } else if (part === 'year' && !val) {
            setAge('');
        }
    };
    
    const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAgeValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
        setAge(newAgeValue);

        const newAge = parseInt(newAgeValue, 10);
        if (!isNaN(newAge) && newAge > 0 && newAge < 120) {
            const currentYear = calendar === 'gregorian' ? currentGregorianYear : currentHijriYear;
            const newYear = String(currentYear - newAge);
            onChange({ ...dob, year: newYear });
        } else if (newAgeValue === '') {
            onChange({ ...dob, year: '' });
        }
    };

    const years = Array.from({ length: 100 }, (_, i) => currentGregorianYear - i);
    const hijriYears = Array.from({ length: 100 }, (_, i) => currentHijriYear - i);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = calendar === 'gregorian' ? GREGORIAN_MONTHS : HIJRI_MONTHS;

    const inputClasses = "w-full px-3 py-2 bg-[var(--color-card-bg)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] text-[16px]";

    return (
        <div>
            <div className="flex justify-center gap-2 mb-2">
                <button type="button" onClick={() => handleDobPartChange('calendar', 'gregorian')} className={`px-3 py-1 text-xs rounded-full font-semibold ${calendar === 'gregorian' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-card-bg)] text-[var(--color-text-secondary)]'}`}>Gregorian</button>
                <button type="button" onClick={() => handleDobPartChange('calendar', 'hijri')} className={`px-3 py-1 text-xs rounded-full font-semibold ${calendar === 'hijri' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-card-bg)] text-[var(--color-text-secondary)]'}`}>Hijri</button>
            </div>
            <div className="grid grid-cols-5 gap-2">
                <select name="month" aria-label="Month of birth" value={dob.month} onChange={e => handleDobPartChange('month', e.target.value)} className={`${inputClasses} col-span-2`}>
                    <option value="">{t('month')}</option>
                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select name="day" aria-label="Day of birth" value={dob.day} onChange={e => handleDobPartChange('day', e.target.value)} className={`${inputClasses} col-span-1`}>
                    <option value="">{t('day')}</option>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div className="relative col-span-2">
                    {inputMode === 'year' ? (
                        <select name="year" aria-label="Year of birth" value={dob.year} onChange={e => handleDobPartChange('year', e.target.value)} className={`${inputClasses} pr-8`}>
                            <option value="">{t('year')}</option>
                            {(calendar === 'gregorian' ? years : hijriYears).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    ) : (
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="age"
                            placeholder={t('ageOptional')}
                            value={age}
                            onChange={handleAgeChange}
                            className={`${inputClasses} pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                            aria-label="Age (will calculate year)"
                        />
                    )}
                    <button
                        type="button"
                        onClick={() => setInputMode(prev => prev === 'age' ? 'year' : 'age')}
                        className="absolute inset-y-0 end-0 flex items-center p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-text-primary)] transition-colors rounded-full hover:bg-[var(--color-border)]"
                        title={inputMode === 'age' ? 'Switch to Year' : 'Switch to Age'}
                    >
                        <SwitchHorizontalIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
             {onClear && (
                <div className="pt-2 text-center">
                    <button type="button" onClick={onClear} className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text-primary)]">
                        Clear Date
                    </button>
                </div>
            )}
        </div>
    );
};

export default DobInput;