const fs = require("fs");

const filePath =
  "/Users/admin/Desktop/z-image.ai/docs/zencreator-generator-by-prompt.templates.llm-rewritten.json";

const nameMap = {
  "Cupid's red satin arrow": "Crimson Cupid Couture",
  "Urban night girl": "City After-Dark Muse",
  "Winter hot tub bliss": "Snow Spa Serenity",
  "Blonde woman standing indoors": "Blonde Hallway Poise",
  "Viva l'Italia!": "Italian Summer Selfie",
  "Big breast beauty on the leather sofa": "Leather Sofa Glam",
  "Close Angle Minimal Shot": "Minimal Close Perspective",
  "Girl in sweatshirt": "Cozy Sweatshirt Portrait",
  "Hotel Tease": "Playful Hotel Bed Pose",
  "Pool hall queen": "Billiards Night Icon",
  "Looking to the warm waves": "Sunlit Shore Gaze",
  "Sunshine at resort": "Resort Glow Pose",
  "Polka dot reverie": "Heart Print Dreamframe",
  "Backshot Allure": "Over-the-Shoulder Allure",
  "Shadow circle solitude": "Spotlight Solitude",
  "Gas station midnight smoking": "Midnight Gas Station Mood",
  "Backseat street style cruise": "Backseat Street Cruise",
  "Red wine nights in leopard luxe": "Leopard Wine Lounge",
  "Fierce fighter roar": "Boxing Fury Burst",
  "Marble Vanity Shot": "Marble Vanity Glam",
  "Urban night happiness": "Rooftop City Joy",
  "Through the hands": "Framed by Fingers",
  "Against the blue sky": "Skyline Upward Stare",
  "Laundry room vibe": "Laundromat Cool",
  "Emerald Lounge Shot": "Emerald Lounge Muse",
  "Luxury Bathroom Shot": "Midnight Bathroom Luxe",
  "Cocktaile party": "Cocktail Hour Siren",
  "Midnight street vibe": "Night Pavement Attitude",
  "Sofa Low Angle": "Low-Angle Sofa Scene",
  "Snack run vibes": "Corner Store Flash Run",
  "Midnight fridge raid": "After-Hours Fridge Run",
  "Christmass mirror-selfie": "Holiday Mirror Moment",
  "Girl in olive casual": "Olive Casual Lift",
  "Portrait on the floor": "Floor-Level Fashion Portrait",
  "Velvet Floor Angle": "Velvet Floor Perspective",
  "Skateboard queen": "Skate Motion Darling",
  "Buying cola": "Convenience Cola Stop",
  "Gymnast in casual wear photoshoot": "Athletic Studio Contour",
  "Spaghetti kiss under string lights": "Stringlight Pasta Flirt",
  "Red swimsuit photoshoot": "Scarlet Swimsuit Editorial",
  "Snake skin & industrial": "Snakeskin Industrial Edge",
  "Flex Motion": "Vertical Flex Energy",
  "Not the best diner": "Diner Sass Close-Up",
  "Shades of purple portrait": "Violet Tension Portrait",
  "Cozy Play Angle": "Cozy Foot-Forward Play",
  "Kitchen Curve Shot": "Kitchen Counterline Pose",
  "Crimson Muse": "Red Accent Muse",
  "Cafe Sunny Shot": "Sunny Cafe Charm",
  "Blondy cowgirl at home": "Homegrown Cowgirl Chic",
  "Cherry 'dessert' in whipped dress": "Cherry Cream Fantasy",
  "Drinking cold milk": "Fridge Light Milk Break",
  "Valentine's velvet": "Velvet Valentine Pose",
  "Feeding my babe": "Diner Date Offering",
  "Hallway retro photo": "Retro Hall Flash",
  "Cloud nine dreamer": "Dreamcloud Reverie",
  "Ebony beauty with cherries": "Cherry Pop Elegance",
  "Obsidian party queen": "Black Balloon Empress",
  "Cherry beauty": "Golden Cherry Glow",
  "Studio Play Pose": "Playful Studio Kick",
  "Cozy Chair Curl": "Curled Chair Comfort",
  "Golden Field Pose": "Sunfield Relaxed Pose",
  "Lavender twilight field": "Lavender Dusk Bloom",
  "Cozy Chair": "Soft Chair Stillness",
  "Kitchen Charm": "Home Kitchen Charm",
  "Beige Power Pose": "Neutral Power Stance",
  "Morning Stretch": "Soft Dawn Stretch",
  "Drinking tequila": "Tequila Lounge Flash",
  "Urban style staircase photoshoot": "Industrial Staircase Editorial",
  "Shadow Floor Angle": "Sunstripe Floor Angle",
  "Pink Selfie": "Blush Floor Selfie",
  "Delicious burger": "Burger Spot Glow",
  "In the trunk with iced coffee": "Trunkside Iced Coffee",
  "Playful Bed Selfie": "Bedside Play Snapshot",
  "Midnight heart sovereign": "Heart Throne at Midnight",
  "Striped Chaos": "Striped Rebellion",
  "Golden Curb Mood": "Golden Hour Curbside",
  "Breakdancer studio shot": "Breakbeat Studio Lift",
  "City Glow": "Nocturnal City Glow",
  "Photoshoot in terracotta studio": "Terracotta Studio Poise",
  "Mall Low Angle": "Mall Floor Perspective",
  "'Pink Beauty' cocktail": "Rosy Cocktail Fantasy",
  "Bare Ground Angle": "Grounded Barefoot Angle",
  "Velvet Gaze": "Velvet Chair Stare",
};

const raw = fs.readFileSync(filePath, "utf8");
const data = JSON.parse(raw);

data.templates = data.templates.map((item) => ({
  ...item,
  TemplateName: nameMap[item.TemplateName] ?? item.TemplateName,
}));

fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      updated: data.templates.length,
      first: data.templates[0].TemplateName,
      last: data.templates[data.templates.length - 1].TemplateName,
    },
    null,
    2
  )
);
