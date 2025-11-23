import React from 'react';
import { DesignStyle } from '../types';

interface StyleSelectorProps {
  selectedStyle: DesignStyle;
  onSelect: (style: DesignStyle) => void;
}

const styles = [
  { id: DesignStyle.Modern, label: 'Modern', color: 'bg-slate-500' },
  { id: DesignStyle.Scandinavian, label: 'Scandinavian', color: 'bg-stone-300' },
  { id: DesignStyle.Japanese, label: 'Japandi', color: 'bg-amber-100' },
  { id: DesignStyle.Industrial, label: 'Industrial', color: 'bg-gray-700' },
  { id: DesignStyle.Minimalist, label: 'Minimalist', color: 'bg-gray-200' },
  { id: DesignStyle.Luxury, label: 'Luxury', color: 'bg-yellow-600' },
  { id: DesignStyle.Bohemian, label: 'Bohemian', color: 'bg-orange-400' },
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelect }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Select Target Style</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`
              relative flex items-center justify-center h-16 rounded-lg border-2 transition-all duration-200
              ${selectedStyle === style.id 
                ? 'border-indigo-500 bg-gray-800 shadow-lg shadow-indigo-500/20' 
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'}
            `}
          >
            {/* Color Indicator Dot */}
            <span className={`absolute left-3 w-3 h-3 rounded-full ${style.color} opacity-80`}></span>
            <span className={`text-sm font-medium ${selectedStyle === style.id ? 'text-white' : 'text-gray-300'}`}>
              {style.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};