'use client';

interface VotingCardsProps {
  selectedValue: number | null;
  onVote: (value: number) => void;
  disabled: boolean;
  isRevealed: boolean;
}

const STORY_POINTS = [2, 4, 8, 16];

export default function VotingCards({ selectedValue, onVote, disabled, isRevealed }: VotingCardsProps) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-slate-500 mb-4 text-center">
        {isRevealed ? 'Voting closed' : 'Select your estimate'}
      </h3>
      
      <div className="flex justify-center gap-4 flex-wrap">
        {STORY_POINTS.map((points) => {
          const isSelected = selectedValue === points;
          
          return (
            <button
              key={points}
              onClick={() => onVote(points)}
              disabled={disabled || isRevealed}
              className={`
                relative group w-20 h-28 rounded-xl font-bold text-2xl
                transition-all duration-200 transform
                ${isSelected 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105 ring-4 ring-blue-300' 
                  : 'bg-white text-slate-700 shadow-md hover:shadow-lg border-2 border-slate-200 hover:border-blue-400'
                }
                ${disabled || isRevealed 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105 active:scale-95 cursor-pointer'
                }
              `}
            >
              <span className="relative z-10">{points}</span>
              
              {/* Checkmark indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              {/* Subtle gradient overlay */}
              <div className={`
                absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity
                ${!isSelected && !disabled && !isRevealed ? 'bg-gradient-to-b from-blue-50 to-transparent' : ''}
              `} />
            </button>
          );
        })}
      </div>
      
      {selectedValue && !isRevealed && (
        <p className="text-center mt-4 text-sm text-green-600 font-medium">
          ✓ Your vote: {selectedValue} story points
        </p>
      )}
    </div>
  );
}

