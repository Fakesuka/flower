import type {
  BuilderFlower,
  BuilderPalette,
  BuilderStyle,
  BuilderWrapping,
  Category,
  ColorOption,
  Product,
  SizeOption,
  Story,
} from '@/types';

export const categories: Category[] = [
  { id: 'roses', name: 'Розы', icon: '🌹' },
  { id: 'mono', name: 'Монобукеты', icon: '💐' },
  { id: 'wedding', name: 'Свадебные', icon: '👰' },
  { id: 'gift', name: 'Подарочные', icon: '🎁' },
];

export const sizeOptions: SizeOption[] = [
  { id: 's', label: 'S', name: 'Маленький', priceModifier: 0, description: 'Нежный компактный букет.' },
  { id: 'm', label: 'M', name: 'Средний', priceModifier: 800, description: 'Оптимальный размер для любого повода.' },
  { id: 'l', label: 'L', name: 'Большой', priceModifier: 1800, description: 'Эффектный букет для особенного момента.' },
];

export const colorPalettes: ColorOption[] = [
  { id: 'classic', name: 'Классика', hex: '#FADADD' },
  { id: 'sunset', name: 'Закат', hex: '#FFC4A3' },
  { id: 'forest', name: 'Лесная', hex: '#BFD8B8' },
  { id: 'snow', name: 'Белоснежная', hex: '#F8F8FF' },
];

export const products: Product[] = [
  {
    id: 'p-rose-cloud',
    name: 'Розовое облако',
    price: 3900,
    originalPrice: 4500,
    image: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=600&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=600&h=600&fit=crop',
    ],
    category: 'roses',
    description: 'Пышный букет из роз и эустомы в пастельной гамме.',
    composition: ['Роза', 'Эустома', 'Эвкалипт'],
    sizes: sizeOptions,
    colors: colorPalettes,
    isBestseller: true,
  },
  {
    id: 'p-white-morning',
    name: 'Белое утро',
    price: 3200,
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&h=600&fit=crop',
    category: 'mono',
    description: 'Воздушный монобукет из белых цветов.',
    composition: ['Хризантема', 'Альстромерия'],
    sizes: sizeOptions,
    colors: colorPalettes,
    isNew: true,
  },
  {
    id: 'p-wedding-day',
    name: 'Свадебный день',
    price: 5600,
    image: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=600&h=600&fit=crop',
    category: 'wedding',
    description: 'Нежный свадебный букет в бело-кремовых оттенках.',
    composition: ['Пионовидная роза', 'Гортензия', 'Рускус'],
    sizes: sizeOptions,
    colors: colorPalettes,
    isBestseller: true,
  },
  {
    id: 'p-spring-gift',
    name: 'Весенний подарок',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=600&h=600&fit=crop',
    category: 'gift',
    description: 'Яркий букет для подарка без повода.',
    composition: ['Тюльпан', 'Ирис', 'Зелень'],
    sizes: sizeOptions,
    colors: colorPalettes,
    isNew: true,
  },
  {
    id: 'p-peach-dream',
    name: 'Персиковая мечта',
    price: 4300,
    image: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=600&h=600&fit=crop',
    category: 'roses',
    description: 'Теплая палитра из персиковых роз и гвоздики.',
    composition: ['Роза', 'Гвоздика', 'Фисташка'],
    sizes: sizeOptions,
    colors: colorPalettes,
  },
];

export const stories: Story[] = [
  { id: 's-1', image: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=500&h=800&fit=crop', title: 'Новинки недели', isNew: true },
  { id: 's-2', image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=500&h=800&fit=crop', title: 'Свадебные букеты' },
  { id: 's-3', image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&h=800&fit=crop', title: 'Скидки дня' },
];

export const builderStyles: BuilderStyle[] = [
  { id: 'romantic', name: 'Романтичный', description: 'Нежные формы и мягкие оттенки', image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&h=800&fit=crop' },
  { id: 'modern', name: 'Современный', description: 'Минимализм и выразительный контраст', image: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=600&h=800&fit=crop' },
  { id: 'classic', name: 'Классический', description: 'Проверенная временем элегантность', image: 'https://images.unsplash.com/photo-1494336934279-4f12b47a1a2e?w=600&h=800&fit=crop' },
];

export const builderFlowers: BuilderFlower[] = [
  { id: 'rose', name: 'Роза', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=500&fit=crop', price: 250 },
  { id: 'peony', name: 'Пион', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=500&h=500&fit=crop', price: 300 },
  { id: 'tulip', name: 'Тюльпан', image: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=500&h=500&fit=crop', price: 180 },
  { id: 'hydrangea', name: 'Гортензия', image: 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=500&h=500&fit=crop', price: 320 },
];

export const builderPalettes: BuilderPalette[] = [
  { id: 'pastel', name: 'Пастель', colors: ['#FADADD', '#FCEEEA', '#F7D6E0'] },
  { id: 'bright', name: 'Яркая', colors: ['#FF7F7F', '#FFD166', '#06D6A0'] },
  { id: 'mono', name: 'Моно', colors: ['#F8F8FF', '#D9D9D9', '#A8A8A8'] },
];

export const builderWrappings: BuilderWrapping[] = [
  { id: 'kraft', name: 'Крафт', image: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?w=500&h=500&fit=crop', price: 0 },
  { id: 'film', name: 'Прозрачная пленка', image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=500&h=500&fit=crop', price: 150 },
  { id: 'box', name: 'Шляпная коробка', image: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=500&h=500&fit=crop', price: 600 },
];

export const messagePresets = [
  { id: 'love', text: 'С любовью 💌' },
  { id: 'thanks', text: 'Спасибо за всё ✨' },
  { id: 'birthday', text: 'С днём рождения! 🎉' },
  { id: 'custom', text: 'Свой текст' },
];
