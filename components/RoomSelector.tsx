import React from 'react';
import { RoomType } from '../types';
import { Armchair, Bed, Tv, Utensils, Car, Layout } from 'lucide-react';

interface RoomSelectorProps {
  selectedRoom: RoomType;
  onSelect: (room: RoomType) => void;
}

const rooms = [
  { id: RoomType.LivingRoom, label: 'Living Room', icon: Armchair },
  { id: RoomType.Bedroom, label: 'Bedroom', icon: Bed },
  { id: RoomType.MediaRoom, label: 'Media Room', icon: Tv },
  { id: RoomType.Kitchen, label: 'Kitchen', icon: Utensils },
  { id: RoomType.KitchenLiving, label: 'Kitchen + Living', icon: Layout },
  { id: RoomType.Garage, label: 'Garage', icon: Car },
];

export const RoomSelector: React.FC<RoomSelectorProps> = ({ selectedRoom, onSelect }) => {
  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Select Room Type</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelect(room.id)}
            className={`
              relative flex items-center justify-center gap-3 h-14 rounded-lg border transition-all duration-200 px-3
              ${selectedRoom === room.id 
                ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:bg-gray-800 hover:text-gray-200'}
            `}
          >
            <room.icon size={18} />
            <span className="text-sm font-medium">{room.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};