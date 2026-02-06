import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Story } from '@/types';

interface StoriesProps {
  stories: Story[];
  onStoryClick?: (story: Story) => void;
}

export function Stories({ stories, onStoryClick }: StoriesProps) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleStoryClick = (story: Story, index: number) => {
    setSelectedStory(story);
    setCurrentIndex(index);
    onStoryClick?.(story);
  };

  const handleClose = () => {
    setSelectedStory(null);
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedStory(stories[currentIndex + 1]);
    } else {
      handleClose();
    }
  };

  return (
    <>
      {/* Stories Row */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar py-2 px-4">
        {stories.map((story, index) => (
          <motion.button
            key={story.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStoryClick(story, index)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div
              className={cn(
                'w-16 h-16 rounded-full p-0.5',
                story.isNew
                  ? 'bg-gradient-to-tr from-dusty-rose via-soft-pink to-eucalyptus'
                  : 'bg-warm-gray/20'
              )}
            >
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-xs text-espresso truncate max-w-[64px]">
              {story.title}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
          >
            {/* Progress Bar */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {stories.map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: idx < currentIndex ? '100%' : idx === currentIndex ? '100%' : '0%',
                    }}
                    transition={{
                      duration: idx === currentIndex ? 5 : 0,
                      ease: 'linear',
                    }}
                    onAnimationComplete={handleNext}
                    className="h-full bg-white"
                  />
                </div>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Story Image */}
            <motion.img
              key={selectedStory.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={selectedStory.image}
              alt={selectedStory.title}
              className="w-full h-full object-cover"
              onClick={handleNext}
            />

            {/* Story Title */}
            <div className="absolute bottom-8 left-4 right-4">
              <h3 className="text-white text-xl font-serif">{selectedStory.title}</h3>
            </div>

            {/* Navigation Areas */}
            <div className="absolute inset-0 flex">
              <div className="flex-1" onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                  setSelectedStory(stories[currentIndex - 1]);
                }
              }} />
              <div className="flex-1" onClick={handleNext} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
