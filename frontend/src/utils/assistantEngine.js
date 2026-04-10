export function getAssistantReply(message, foods, contextMemory = {}) {
  const text = message.toLowerCase();
  
  if (text.includes("cheap") || text.includes("budget")) {
    const cheapFoods = [...foods]
      .filter(f => Number(f.price) > 0)
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, 3);
    
    if (cheapFoods.length > 0) {
      return {
        reply: `Here are some budget-friendly options! ${cheapFoods.map(f => f.name).join(', ')}`,
        context: { interest: 'cheap' }
      };
    }
  }

  if (text.includes("drink")) {
    const drinks = foods
      .filter(f => f.category?.toLowerCase().includes("drink") || f.category?.toLowerCase() === "beverage")
      .slice(0, 3);
    
    if (drinks.length > 0) {
      return {
        reply: `Quench your thirst with these: ${drinks.map(f => f.name).join(', ')}.`,
        context: { interest: 'drink' }
      };
    }
  }

  if (text.includes("dessert")) {
    const desserts = foods
      .filter(f => f.category?.toLowerCase().includes("dessert") || f.category?.toLowerCase() === "sweet")
      .slice(0, 3);
    
    if (desserts.length > 0) {
      return {
        reply: `Got a sweet tooth? Try: ${desserts.map(f => f.name).join(', ')}.`,
        context: { interest: 'dessert' }
      };
    }
  }

  if (text.includes("recommend") || text.includes("best") || text.includes("popular")) {
    const popular = [...foods]
      .sort((a, b) => {
        const scoreA = ((a.orderCount || Math.random() * 100) * 0.6);
        const scoreB = ((b.orderCount || Math.random() * 100) * 0.6);
        return scoreB - scoreA;
      })
      .slice(0, 3);
    
    if (popular.length > 0) {
      return {
        reply: `These are super popular right now: ${popular.map(f => f.name).join(', ')}. Highly recommended!`,
        context: { interest: 'popular' }
      };
    }
  }

  if (text.includes("combo")) {
    return {
      reply: `Our smart combos include a Meal, a Drink, and a Dessert with a 10% discount! Check out the Recommended For You section above your menu.`,
      context: { interest: 'combo' }
    };
  }

  // Uses context memory if no specific keyword matched
  if (contextMemory.interest === 'drink') {
    return {
      reply: `Still thinking about drinks? Our fresh juices are running out fast today!`,
      context: { interest: 'drink' }
    };
  }
  
  if (contextMemory.interest === 'dessert') {
    return {
      reply: `If you're still looking for desserts, I'd suggest our chocolate categories.`,
      context: { interest: 'dessert' }
    };
  }

  // Default response showing trending
  const trending = [...foods]
    .sort((a, b) => Number(b.price) - Number(a.price))
    .slice(0, 2);
    
  return {
    reply: `Hmm, I'm not sure. But students are loving ${trending.length ? trending.map(f => f.name).join(' and ') : 'our latest additions'}! Let me know if you want "cheap" food, "drinks", or a "combo".`,
    context: { interest: 'general' }
  };
}
