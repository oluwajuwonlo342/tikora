import React from 'react';
import { Link } from 'react-router-dom';
import { Music, PartyPopper, Briefcase, Palette, Trophy, BookOpen, Tent, Mic2 } from 'lucide-react';

const Categories = () => {
  // Define our platform categories mapping exactly to the filters on the Events page
  const categoryList = [
    {
      id: 'music',
      name: 'Music & Concerts',
      description: 'Live bands, festivals, and artist tours near you.',
      icon: <Music size={32} />
    },
    {
      id: 'party',
      name: 'Party & Nightlife',
      description: 'Exclusive club events, raves, and social gatherings.',
      icon: <PartyPopper size={32} />
    },
    {
      id: 'business',
      name: 'Business & Tech',
      description: 'Networking events, tech seminars, and startup pitches.',
      icon: <Briefcase size={32} />
    },
    {
      id: 'arts',
      name: 'Arts & Culture',
      description: 'Art exhibitions, theater plays, and cultural festivals.',
      icon: <Palette size={32} />
    },
    {
      id: 'sports',
      name: 'Sports & Fitness',
      description: 'Marathons, local tournaments, and fitness bootcamps.',
      icon: <Trophy size={32} />
    },
    {
      id: 'education',
      name: 'Education',
      description: 'Workshops, masterclasses, and academic conferences.',
      icon: <BookOpen size={32} />
    },
    {
      id: 'festival',
      name: 'Festivals',
      description: 'Food, culture, and seasonal community festivals.',
      icon: <Tent size={32} />
    },
    {
      id: 'comedy',
      name: 'Comedy Shows',
      description: 'Stand-up comedy, improv, and open mic nights.',
      icon: <Mic2 size={32} />
    }
  ];

  return (
    <div className="categories-page">
      <div className="categories-header animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1>Explore by Category</h1>
        <p>Find exactly what you're looking for. Browse our curated categories to discover the best events matching your interests.</p>
      </div>

      <div className="categories-grid">
        {categoryList.map((cat, index) => (
          <Link 
            key={cat.id} 
            to={`/events?category=${cat.id}`} 
            className="category-card animate-in fade-in slide-in-from-bottom-8"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
          >
            <div className="category-icon-wrapper">
              {cat.icon}
            </div>
            <h3>{cat.name}</h3>
            <p>{cat.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;