import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { SearchResultItem } from '@/utils/searchUtils';
import { HorizontalScroll } from '../utilities/HScroll';



interface CharacterCatalogProps {
    characters: SearchResultItem[];
    layout?: 'l' | 't';
    onClick?: (char: SearchResultItem) => void;
}

interface CharacterCardProps {
    char: SearchResultItem;
    layout: 'l' | 't';
    index: number;
    onClick?: (char: SearchResultItem) => void;
}

const CharacterCard = memo(({ char, layout, index, onClick }: CharacterCardProps) => {
    const isLandscape = layout === "l";

    return (
        <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
                type: 'spring',
                mass: 1,
                stiffness: 160,
                damping: 20,
                delay: index * 0.05
            }}
            onClick={() => onClick?.(char)}
            className={`${isLandscape ? "w-64 h-32 flex justify-end" : "w-45 h-64 flex flex-col justify-end"} text-start p-2 py-3 bg-white/2 border border-white/5 rounded-xl overflow-hidden shrink-0 cursor-pointer relative`}
        >
            {isLandscape ? (
                <>
                    <img
                        className="absolute top-0 left-0 h-full w-32 object-cover object-[50%_30%] -z-1"
                        style={{ maskImage: "linear-gradient(to right, black, rgba(0,0,0,0))" }}
                        src={char.image}
                        alt={char.name}
                    />
                    <div className="max-w-42">
                        <h1 className="whitespace-nowrap font-extrabold">{char.name}</h1>
                        <p className="text-xs opacity-50">
                            {char.description && char.description.length > 50
                                ? char.description.slice(0, 50) + "..."
                                : char.description}
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <img
                        className="absolute top-0 left-0 h-52 w-full object-cover object-[50%_30%] -z-1"
                        style={{ maskImage: "linear-gradient(to bottom, black, rgba(0,0,0,0))" }}
                        src={char.image}
                        alt={char.name}
                    />
                    <h1 className="whitespace-nowrap font-extrabold">{char.name}</h1>
                    <p className="text-xs opacity-50 h-18">
                        {char.description && char.description.length > 100
                            ? char.description.slice(0, 100) + "..."
                            : char.description}
                    </p>
                </>
            )}
        </motion.button>
    );
});

CharacterCard.displayName = 'CharacterCard';

const SkeletonCard = memo(({ index, layout }: { index: number, layout: 'l' | 't' }) => (
    <div
        style={{ animationDelay: `${index * 100}ms` }}
        className={`${layout === "l" ? "w-64 h-32" : "w-45 h-64"} bg-white/5 rounded-xl animate-pulse shrink-0`}
    />
));

SkeletonCard.displayName = 'SkeletonCard';

const CharacterCatalog = memo(({ characters, layout = 'l', onClick }: CharacterCatalogProps) => {
    const isLoading = characters.length < 1;

    return (
        <HorizontalScroll className="flex gap-2 overflow-x-auto w-full pb-2 hide-scrollbar px-6">
            {isLoading
                ? Array.from({ length: 20 }).map((_, idx) => (
                    <SkeletonCard key={idx} index={idx} layout={layout} />
                ))
                : characters.map((char, idx) => (
                    <CharacterCard
                        key={char.id || idx}
                        char={char}
                        index={idx}
                        layout={layout}
                        onClick={onClick}
                    />
                ))
            }
        </HorizontalScroll>
    );
});

CharacterCatalog.displayName = 'CharacterCatalog';

export default CharacterCatalog;