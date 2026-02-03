# Quillty - Product Requirements Document

## 1. Overview

### 1.1 Problem Statement
Quilters currently rely on fragmented resources—physical books, magazine clippings, scattered PDFs, and various websites—to find, store, and create quilting patterns. There is no unified platform that combines pattern discovery, creation tools, and community engagement tailored to the quilting workflow.

### 1.2 Solution
Quillty is a social platform for quilting enthusiasts that enables users to discover, create, and share quilting patterns. The platform combines a visual pattern designer with social features (likes, saves, comments, follows) and a marketplace where creators can monetize their work.

### 1.3 Target Platforms
- Web application (responsive, tablet-optimized)
- iOS native application
- Simultaneous launch on both platforms

### 1.4 Go-to-Market: Creator-First Strategy
The platform will launch with a creator acquisition focus, recruiting quilting content creators from existing platforms (TikTok, Instagram, YouTube) to seed the marketplace with quality patterns.

**Why Creator-First**
- Creators bring their existing audiences to Quillty
- Quality content attracts consumers organically
- Creators are motivated to promote their Quillty profile

**Creator Value Proposition**
- Single link-in-bio destination for all patterns
- Monetization without setting up own e-commerce
- Built-in audience through For You algorithm
- Analytics on traffic and conversions

**Early Creator Program**
- Outreach to quilting influencers for beta access
- Gather feedback to refine creator tools
- Potential incentives: reduced platform fees, featured placement

---

## 2. Target Users

### 2.1 Demographics
| Attribute | Primary Audience | Secondary Audience |
|-----------|------------------|-------------------|
| Age | 55-75 years old | Under 40 (growing segment) |
| Gender | ~85% female | ~15% male |
| Experience | 10+ years quilting | New quilters (8-10% of market) |
| Income | $75K+ household | Varies |
| Tech comfort | Moderate; uses tablets | Higher; mobile-native |

### 2.2 User Personas

**Persona 1: Margaret (Primary)**
- 64 years old, retired teacher
- Quilts 6+ hours/week, 10 active projects
- Has boxes of pattern books and magazine clippings
- Uses iPad at her sewing table
- Wants: Organization, easy discovery, print-friendly patterns
- Frustration: Scattered resources, complex software, small text/buttons

**Persona 2: Sarah (Secondary)**
- 34 years old, marketing professional
- Started quilting 2 years ago via YouTube
- Wants modern, trendy patterns
- Comfortable with apps and social media
- Wants: Inspiration, community, quick projects
- Frustration: Outdated pattern aesthetics, lack of social features

**Persona 3: Linda (Traditional Creator)**
- 58 years old, former graphic designer
- Creates original patterns, sells at craft fairs
- Wants to reach broader audience online
- Wants: Easy publishing, fair monetization, audience growth
- Frustration: Complex e-commerce setup, payment processing

**Persona 4: Jessica (Content Creator / Influencer)**
- 41 years old, quilting content creator
- 85K followers on TikTok, 32K on Instagram
- Posts tutorials, process videos, finished quilts
- Currently links to Etsy/Patreon/Ko-fi in bio
- Quilts 15+ hours/week, treats it as side business
- Wants: Single link-in-bio for all patterns, passive income, audience analytics
- Frustration: Managing multiple platforms, Etsy fees, no centralized pattern home
- Tech-savvy, expects modern UX and mobile-first design
- Key behavior: Will promote Quillty to her audience if the platform serves her well

---

## 3. User Types & Permissions

### 3.1 User Roles

| Role | Description |
|------|-------------|
| **User** | Standard account; can browse, engage, create free patterns, purchase premium patterns |
| **Partner** | Verified creator account; can monetize patterns, access analytics, receive payouts |

### 3.2 Permissions Matrix

| Capability | User | Partner |
|------------|------|---------|
| Browse patterns | ✅ | ✅ |
| Like, save, comment | ✅ | ✅ |
| Follow creators | ✅ | ✅ |
| Create patterns | ✅ | ✅ |
| Publish free patterns | ✅ | ✅ |
| Publish premium (paid) patterns | ❌ | ✅ |
| Set pattern prices | ❌ | ✅ |
| Receive payouts | ❌ | ✅ |
| View creator analytics | ❌ | ✅ |
| Verification badge | ❌ | ✅ |
| Purchase premium patterns | ✅ | ✅ |
| Access print view | ✅ | ✅ |

### 3.3 Partner Upgrade Path
- Users build following by sharing free patterns
- Apply/upgrade to Partner status when ready to monetize
- Partner requirements: TBD (identity verification, tax info, minimum engagement threshold)

---

## 4. Core Features

### 4.1 Content Discovery

#### 4.1.1 Feed System
The main feed displays both **quilt patterns** and **blocks** as content types.

| Feed | Description |
|------|-------------|
| **For You** | Algorithmic feed of patterns AND blocks based on likes, saves, follows, and browsing behavior |
| **Following** | Chronological patterns AND blocks from followed creators |

**Content Types in Feed:**
- Quilt patterns (free and premium)
- Blocks (always free)
- Both appear in unified masonry grid with visual distinction

#### 4.1.2 Feed UI
- Masonry grid layout (Pinterest-style)
- **Pattern cards** show: thumbnail, title, creator, like count, price (if premium)
- **Block cards** show: thumbnail, name, creator, like count, "Block" badge
- Content type visually distinguished (block badge, aspect ratio)
- Infinite scroll pagination
- Pull-to-refresh

#### 4.1.3 Search & Filtering
| Filter | Options |
|--------|---------|
| Category | Traditional, Modern, Art, Baby, Holiday, etc. |
| Difficulty | Beginner, Intermediate, Advanced |
| Size | Wall hanging, Lap, Twin, Queen, King |
| Price | Free, Under $5, $5-10, $10+ |
| Style | Geometric, Floral, Abstract, Sampler, etc. |
| Hashtags | User-defined tags (e.g., #scrappyquilt, #christmasquilt) |

#### 4.1.4 Hashtags
Creators can add hashtags to block and quilt pattern descriptions for discoverability.

| Feature | Details |
|---------|---------|
| Format | #tagname in description (auto-linked) |
| Discovery | Tap hashtag → see all content with that tag |
| Trending | Surface popular/trending hashtags |
| Suggestions | Auto-suggest hashtags based on content type |
| Limits | Max 10 hashtags per block/pattern |

### 4.2 Block Creation & Library

Blocks are the atomic building units of quilts. Users can create custom blocks and share them with the community.

#### 4.2.1 Block Types
| Type | Description |
|------|-------------|
| **Platform blocks** | Traditional blocks provided by Quillty (Log Cabin, Flying Geese, Ohio Star, etc.) |
| **User blocks** | Custom blocks created and published by users |

#### 4.2.2 Block Designer
- Grid-based design canvas (customizable grid size)
- Shape tools: squares, half-square triangles, quarter-square triangles, curves
- Color/fabric assignment per section
- Symmetry tools (mirror, rotate)
- Preview at different sizes

#### 4.2.3 Block Publishing
| Rule | Details |
|------|---------|
| **Pricing** | All user blocks are free (no premium blocks) |
| **Feed visibility** | Published blocks appear in For You and Following feeds |
| **Usage rights** | Published blocks can be used in any quilt (free or premium) |
| **Attribution** | When a block is used in a quilt, creator is credited |
| **Engagement** | Blocks can be liked, saved, and commented on like patterns |
| **Visibility** | Draft (private) or Published (public) |

#### 4.2.4 Block Discovery
- Browse blocks separately from quilts
- Filter by: style, piece count, difficulty, creator
- Search by name
- See quilts that use a specific block

### 4.3 Quilt Pattern Creation

#### 4.3.1 Visual Pattern Designer
- Drag-and-drop block placement
- Block library: platform blocks + saved user blocks
- Color/fabric assignment per block section
- Resize quilt (block count, finished dimensions)
- Real-time preview of full quilt

#### 4.3.2 Fabric Selection
- Solid color palette
- Upload custom fabric photos from device
- Pre-loaded fabric libraries (Kona Cottons, Art Gallery, Riley Blake)
- Color harmony suggestions

#### 4.3.3 Platform-Generated Output
The platform automatically generates:
- Fabric requirements (yardage calculations)
- Cutting instructions
- Block assembly diagrams
- Quilt assembly layout
- Binding calculations

#### 4.3.4 Pattern States
| State | Description |
|-------|-------------|
| Draft | Private, work in progress |
| Published (Free) | Public, anyone can access |
| Published (Premium) | Public, requires purchase to access |

### 4.4 Pattern Access & Viewing

#### 4.4.1 Access Levels
| Pattern Type | Preview | Full Access | Print View |
|--------------|---------|-------------|------------|
| Free | ✅ Full | ✅ All users | ✅ |
| Premium (not purchased) | ✅ Limited (watermarked/partial) | ❌ | ❌ |
| Premium (purchased) | ✅ Full | ✅ | ✅ |
| Private draft | N/A | ✅ Owner only | ✅ Owner only |

#### 4.4.2 Print View
- Browser-printable format (not downloadable PDF)
- Optimized for 8.5x11" paper
- Includes all instructions, diagrams, fabric requirements
- Protects against easy digital redistribution

#### 4.4.3 In-App Viewing
- Step-by-step instructions
- Interactive checklist (mark completed steps)
- Zoom on diagrams
- Progress tracking

### 4.5 Derivatives & Remixing

#### 4.5.1 Rules
| Original Content | Derivative Can Be |
|------------------|-------------------|
| Free block | Used in any quilt (free or premium) with attribution |
| Free quilt pattern | Published free with attribution only |
| Premium quilt pattern | No derivatives allowed (view only) |

**Note:** Private drafts/remixes of other users' patterns are not allowed to prevent pattern theft. Users can only create original patterns or publish free derivatives (with attribution) of free patterns.

#### 4.5.2 Attribution
When a block or derivative pattern is used:
- Original creator automatically credited
- Link to original block/pattern
- "Uses [Block Name] by [Creator]" or "Remixed from [Pattern] by [Creator]"

### 4.6 Social & Engagement

#### 4.6.1 Engagement Actions
All engagement actions apply to both **blocks** and **quilt patterns**.

| Action | Description |
|--------|-------------|
| **Like** | Quick appreciation; affects algorithm ranking for feed |
| **Save** | Bookmark to private collection |
| **Comment** | Discussion, questions, share completed projects |
| **Follow** | Subscribe to creator's new patterns and blocks |

#### 4.6.2 User Profile
- Display name and avatar
- Bio
- Follower/following counts
- Created patterns and blocks grid
- Saved patterns (private or public option)
- Purchased patterns (private)

#### 4.6.3 Creator Profile (Partners)
- All user profile features
- Verification badge
- Total likes received
- Pattern and block catalog with sales indicators

#### 4.6.4 Public Profile Pages (Link-in-Bio)
Creators need shareable profile URLs to drive traffic from external platforms (TikTok, Instagram, YouTube, etc.).

**URL Structure**
- `quillty.com/@username` — clean, memorable, shareable
- Custom username selection during signup (unique, alphanumeric + underscores)

**Public Profile Features**
| Element | Description |
|---------|-------------|
| Profile header | Avatar, display name, bio, follower count |
| Social links | Optional links to TikTok, Instagram, YouTube, website |
| Featured patterns | Creator-curated top patterns (pinned) |
| All patterns grid | Masonry grid of all published patterns |
| Follow button | Prominent CTA for visitors to follow |
| Pattern filters | Free / Premium toggle for visitors |

**SEO & Sharing**
- Open Graph meta tags for rich previews when shared
- Profile appears in search engines
- Mobile-optimized landing page (most TikTok traffic is mobile)

**Analytics for Creators**
- Profile views (total, by source/referrer)
- Click-through to individual patterns
- Conversion: profile view → follow
- Conversion: profile view → purchase

### 4.7 Commerce

#### 4.7.1 Pricing
- Partners set their own prices for premium quilt patterns
- Blocks are always free (no premium blocks)
- Minimum price: TBD (e.g., $1.00)
- Maximum price: TBD (e.g., $50.00)
- Platform fee: TBD (10-30% range)

#### 4.7.2 Purchase Flow
1. User views premium pattern preview
2. User taps "Purchase" button
3. Secure checkout (Stripe)
4. Instant access to full pattern
5. Pattern added to "Purchased" collection

#### 4.7.3 Refund Policy
- Non-refundable after purchase (digital goods)
- Robust preview available before purchase
- Dispute process for fraudulent/broken patterns

#### 4.7.4 Partner Payouts
- Earnings dashboard showing sales, fees, net revenue
- Payout threshold: TBD (e.g., $10 minimum)
- Payout schedule: TBD (weekly, bi-weekly, monthly)
- Payment methods: Bank transfer, PayPal (via Stripe Connect)

### 4.8 Content Updates
- Creators can update published blocks and patterns
- All users who saved/purchased receive the update
- Version history maintained
- Notification sent for significant updates
- Quilts using updated blocks automatically reflect changes

---

## 5. User Stories

### 5.1 Discovery & Browsing
| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| D1 | As a user, I want to browse a personalized feed so that I discover patterns I'll like | For You feed shows patterns based on my activity |
| D2 | As a user, I want to see patterns from creators I follow so that I don't miss their new work | Following feed shows chronological posts from followed creators |
| D3 | As a user, I want to search and filter patterns so that I find exactly what I need | Search by keyword; filter by category, difficulty, size, price |
| D4 | As a user, I want to preview premium patterns before buying so that I know what I'm getting | Premium patterns show partial/watermarked preview |
| D5 | As a user, I want to browse blocks separately so that I can find building blocks for my quilts | Block library browsable with filters |
| D6 | As a user, I want to see which quilts use a specific block so that I get design inspiration | Block detail page shows quilts using it |
| D7 | As a user, I want to tap a hashtag to see related content so that I discover similar patterns | Hashtag page shows all blocks/patterns with that tag |
| D8 | As a creator, I want to add hashtags to my patterns so that they're easier to discover | Hashtags in description auto-link; max 10 per pattern |

### 5.2 Engagement
| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| E1 | As a user, I want to like patterns so that I can show appreciation | Like count increments; pattern saved to liked collection |
| E2 | As a user, I want to save patterns so that I can find them later | Pattern added to saved collection |
| E3 | As a user, I want to comment on patterns so that I can ask questions or share my version | Comments appear on pattern; creator notified |
| E4 | As a user, I want to follow creators so that I see their new patterns | Creator added to following; their patterns appear in Following feed |

### 5.3 Block Creation
| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| B1 | As a user, I want to design a custom block so that I can create unique quilt designs | Block designer opens with grid canvas and shape tools |
| B2 | As a user, I want to publish my block so that others can use it in their quilts | Block appears in block library; accessible to all users |
| B3 | As a user, I want to see how many quilts use my block so that I know its impact | Block detail shows usage count and example quilts |
| B4 | As a user, I want to use a community block in my quilt so that I can build on others' work | Block can be added to quilt designer; creator credited |

### 5.4 Quilt Pattern Creation
| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| C1 | As a user, I want to create a quilt pattern from scratch so that I can design my own quilt | Visual designer opens; can place blocks, assign colors |
| C2 | As a user, I want to remix an existing free pattern so that I can customize it | Creates copy that must be published free with attribution |
| C3 | As a user, I want the platform to calculate fabric requirements so that I know what to buy | Yardage auto-calculated based on design |
| C4 | As a user, I want to save my pattern as a draft so that I can finish it later | Pattern saved privately; accessible from my profile |
| C5 | As a user, I want to publish my pattern for free so that others can use it | Pattern appears in feeds; accessible to all users |

### 5.5 Commerce
| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| P1 | As a partner, I want to set a price on my pattern so that I can earn money | Price input on publish; pattern marked as premium |
| P2 | As a user, I want to purchase a premium pattern so that I can access the full design | Checkout completes; pattern added to purchased collection |
| P3 | As a partner, I want to see my earnings so that I know how my patterns perform | Dashboard shows sales, revenue, fees |
| P4 | As a partner, I want to withdraw my earnings so that I receive my money | Payout request processed; funds transferred |

### 5.6 Pattern Access
| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| A1 | As a user, I want to print a pattern so that I can use it at my sewing table | Print view renders cleanly; all instructions included |
| A2 | As a user, I want to track my progress so that I know where I left off | Checklist persists; progress percentage shown |
| A3 | As a user, I want to access patterns I've purchased so that I can use them anytime | Purchased collection shows all bought patterns |

### 5.7 Creator Profile & Growth
| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| G1 | As a creator, I want a public profile URL so that I can share it on TikTok/Instagram | Profile accessible at quillty.com/@username |
| G2 | As a creator, I want to pin my best patterns so that visitors see them first | Featured/pinned patterns appear at top of profile |
| G3 | As a creator, I want to see where my profile traffic comes from so that I know which platforms drive followers | Analytics show referrer breakdown |
| G4 | As a visitor, I want to browse a creator's patterns and follow them so that I can see their future work | Follow button works without requiring signup (prompts after) |
| G5 | As a creator, I want my profile to look good when shared so that people click the link | Open Graph tags generate rich preview with avatar and bio |

---

## 6. Out of Scope (v1)

The following features are explicitly NOT included in the initial release:

| Feature | Reason |
|---------|--------|
| Downloadable PDF files | Piracy risk; print view sufficient |
| Subscription tiers | Simplify launch; add based on demand |
| Native Android app | Focus on web + iOS first |
| Direct messaging | Moderation complexity; use comments |
| Live collaboration | Technical complexity |
| Physical product sales | Focus on digital patterns |
| Longarm quilter directory | Future feature |
| Video tutorials | Future content type |
| Offline mode | Requires significant native development |
| Affiliate program | Post-launch monetization |

---

## 7. Non-Functional Requirements

### 7.1 Accessibility
| Requirement | Rationale |
|-------------|-----------|
| WCAG 2.1 AA compliance | Primary demographic has vision considerations |
| Minimum touch target 44x44px | Older users; arthritic hands common |
| Minimum font size 16px | Readability |
| High contrast mode | Vision accessibility |
| Screen reader support | Inclusive design |

### 7.2 Performance
| Metric | Target |
|--------|--------|
| Initial page load | < 3 seconds |
| Feed infinite scroll | < 1 second per page |
| Pattern designer responsiveness | < 100ms interaction feedback |
| Image optimization | WebP with fallbacks |

### 7.3 Security
| Requirement | Implementation |
|-------------|----------------|
| Authentication | Email + password; social login (Google, Apple) |
| Payment security | PCI-compliant via Stripe |
| Data encryption | HTTPS everywhere; encrypted at rest |
| Content protection | No direct file downloads; print view only |

### 7.4 Platform Support
| Platform | Minimum Version |
|----------|-----------------|
| iOS | 15.0+ |
| Safari | Latest 2 versions |
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Edge | Latest 2 versions |

---

## 8. Success Metrics

### 8.1 Acquisition
| Metric | Definition |
|--------|------------|
| Sign-ups | New user registrations |
| App downloads | iOS app installs |
| Partner applications | Users applying for Partner status |

### 8.2 Engagement
| Metric | Definition |
|--------|------------|
| DAU/MAU | Daily/Monthly active users |
| Patterns created | New quilt patterns published |
| Blocks created | New blocks published |
| Block usage rate | Blocks used in quilts / total blocks |
| Engagement rate | (Likes + saves + comments) / impressions |
| Follow rate | Follows / profile views |

### 8.3 Retention
| Metric | Definition |
|--------|------------|
| D1/D7/D30 retention | Users returning after 1/7/30 days |
| Patterns completed | Progress tracked to 100% |
| Repeat creators | Users who publish 2+ patterns |

### 8.4 Revenue
| Metric | Definition |
|--------|------------|
| GMV | Gross merchandise value (total sales) |
| Platform revenue | GMV × platform fee |
| ARPU | Average revenue per user |
| Partner conversion | % of users who become Partners |

---

## 9. Open Questions

| Question | Options | Decision Needed By |
|----------|---------|-------------------|
| Platform fee percentage | 10%, 15%, 20%, 30% | Before Partner launch |
| Partner requirements | Verification only, follower threshold, quality review | Before Partner launch |
| Minimum/maximum pattern price | $1-$50? $0.99-$99? | Before commerce launch |
| Payout threshold and schedule | $10/weekly, $25/monthly, etc. | Before Partner launch |
| Moderation approach | Pre-publish review, community reporting, AI moderation | Before launch |
| Platform block library | Which traditional blocks to include at launch | Before pattern designer |

---

## 10. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-01 | — | Initial PRD |
| 1.1 | 2026-02-01 | — | Added public creator profiles (link-in-bio), go-to-market strategy |
| 1.2 | 2026-02-01 | — | Added Persona 4: Jessica (Content Creator / Influencer) |
| 1.3 | 2026-02-01 | — | Added block creation & publishing (free-only), block designer, block user stories |
| 1.4 | 2026-02-01 | — | Removed private drafts for derivatives (theft protection); added hashtags for discovery |
| 1.5 | 2026-02-01 | — | Blocks now appear in feeds and support full engagement (like, save, comment) |
