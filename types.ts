export enum DesignStyle {
  Modern = 'Modern',
  Scandinavian = 'Scandinavian',
  Japanese = 'Japanese Japandi',
  Industrial = 'Industrial Loft',
  Minimalist = 'Minimalist',
  Luxury = 'Luxury Classic',
  Bohemian = 'Bohemian',
}

export enum RoomType {
  LivingRoom = 'Living Room',
  Bedroom = 'Bedroom',
  MediaRoom = 'Media Room',
  Kitchen = 'Kitchen',
  KitchenLiving = 'Kitchen + Living Room',
  Garage = 'Garage',
}

export enum AppMode {
  Upload = 'UPLOAD',
  RemoveFurniture = 'REMOVE_FURNITURE',
  StyleTransfer = 'STYLE_TRANSFER',
  AddFurniture = 'ADD_FURNITURE',
  Result = 'RESULT',
}

export interface ProcessingState {
  isLoading: boolean;
  statusMessage: string;
  progress: number;
}

export interface ComparisonProps {
  beforeImage: string;
  afterImage: string;
}