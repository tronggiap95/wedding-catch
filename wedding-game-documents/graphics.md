Wedding Catch - Art Direction Specification
Overall Style

Wedding Catch uses a Stylized 2D Casual Mobile Game art style inspired by successful casual games such as Royal Match, Homescapes and Candy Crush.

The visual identity should feel:

Cute
Warm
Elegant
Cheerful
Romantic
Family-friendly
Highly readable on small mobile screens

The game should immediately communicate a joyful wedding atmosphere.

Visual Keywords

Always follow these keywords:

Stylized 2D
Casual Mobile Game
Chibi
Soft Pastel
Rounded Shapes
Clean Vector Style
Bright Lighting
High Contrast
Minimal Details
Soft Gradient
Friendly
Wedding Theme
Premium Mobile Game

Avoid realistic rendering.

Character Design

Characters use Chibi proportions.

Rules:

Head occupies around 45~50% of total height.
Large expressive eyes.
Small nose.
Small mouth.
Round face.
Short limbs.
Large hands are acceptable.
No visible muscles.
No realistic anatomy.

The characters should feel like collectible mascots instead of realistic humans.

Shape Language

Everything in the game should be built using rounded shapes.

Preferred:

Circle
Oval
Rounded rectangle
Soft curves

Avoid:

Sharp corners
Thin objects
Complex silhouettes
Realistic proportions

Players should recognize every object in less than 0.5 seconds.

Colors

Primary colors:

Warm Pink
Peach
Cream
Gold
White
Soft Red
Rose
Champagne Gold
Light Green
Sky Blue

Avoid:

Dark gray
Dirty colors
Desaturated palettes
Horror colors

The overall palette should remain bright.

Lighting

Lighting should be simple.

Requirements:

Soft top lighting
Small highlight
Gentle ambient shadow
No hard shadow
No dramatic lighting
No realistic reflections

Objects should look polished like mobile game icons.

Materials

Every material should look simplified.

Gold

Bright yellow
Soft highlight
Slight gradient

Glass

Semi-transparent
White highlight

Wood

Simple grain
Warm brown

Fabric

Soft folds
Minimal wrinkles

Flowers

Rounded petals
Saturated colors
Outline

Use thin clean outlines.

Outline color should not be pure black.

Instead use:

Dark Brown

or

Dark Purple

The outline should feel soft.

Item Design

Each collectible item should:

Be centered.
Occupy around 80% of canvas.
Have transparent background.
Have no text.
Have no border.
Have no shadow outside the object.
Be readable at 64x64 pixels.
Animation Style

Animation should be lightweight.

Examples:

Idle

Floating
Gentle breathing

Collect

Scale up
Fade
Sparkle

UI

Bounce
Pop
Ease Out

Avoid:

Long animation
Realistic physics
Heavy particles
Background Style

Backgrounds should be:

Soft

Layered

Bright

Simple

Decorative

Low detail

Gameplay readability has higher priority than realism.

UI Style

Buttons

Rounded

Glossy

Soft gradient

Large touch targets

Icons

Simple

Filled

Rounded

Easy to identify

Fonts

Bold

Rounded

Friendly

Readable on mobile

Effects

Particles should use:

Hearts

Sparkles

Stars

Flowers

Ribbon

Confetti

Avoid:

Smoke

Blood

Fire

Dark magic

Design Principles

Every asset must satisfy:

Recognizable in under 0.5 seconds.
Readable at 64×64 pixels.
Transparent PNG.
Consistent lighting.
Consistent perspective.
Consistent scale.
Rounded silhouette.
Mobile-first readability.
Things to Avoid

Never generate:

Realistic humans
Anime style
Pixel art
Low-poly 3D
Dark fantasy
Horror
Cyberpunk
Photorealistic textures
Excessive details
Sharp edges
Gothic themes
Quality Benchmark

The target visual quality should be comparable to:

Royal Match
Homescapes
Gardenscapes
Candy Crush Saga
My Talking Tom Friends

The game should look like a polished commercial casual mobile game rather than an indie prototype.

Thêm một gợi ý rất quan trọng cho Claude Code

Claude không thể "nhìn" phong cách như người, nên bạn nên quy định thêm các design token để mọi thành phần UI và game luôn nhất quán:

artStyle:
  style: "Stylized 2D Casual Mobile Game"
  theme: "Wedding"
  mood: "Cute, Warm, Romantic"

designTokens:
  borderRadius: 16px
  buttonRadius: 24px
  iconSize: 64px
  itemCanvas: 512x512
  uiShadow: soft
  outline: darkBrown
  palette: pastel
  lighting: softTopLight
  perspective: orthographic
  characterScale: chibi
  backgroundDetail: low