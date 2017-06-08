import { HighlightType, Highlight, highlightRegions } from "./syntax";
import { Module, compile, run } from "./compile";
import { Interval } from "./utilities"

// Due to inconsistencies in how browsers handle contenteditable divs, this
// code is only confirmed to work in Firefox.

class AttributedTextBox {
    private currentTagCharCount: number;
    private internalHTMLState: string;
    public compiled: Module;

    constructor(private div: HTMLElement, initialInput: string) {
        div.contentEditable = "true";
        div.addEventListener("input", () => this.performSyntaxHighlighting());
        this.currentTagCharCount = 0;
        this.internalHTMLState = initialInput;
        this.commit();
        this.performSyntaxHighlighting();
    }

    commit() {
        this.div.innerHTML = this.internalHTMLState;
    }

    reset() {
        this.div.innerText = this.div.innerText;
    }

    getInnerText() {
        return this.div.innerText;
    }

    makeRangeTagged(startIndex: number, endIndex: number, openTag: string, closeTag: string) {
        startIndex += this.currentTagCharCount;
        endIndex += this.currentTagCharCount;
        let oldHTML = this.internalHTMLState;
        let newHTML = oldHTML.slice(0, startIndex) + openTag + oldHTML.slice(startIndex, endIndex) + closeTag + oldHTML.slice(endIndex);
        this.internalHTMLState = newHTML;
        this.currentTagCharCount += (openTag.length + closeTag.length);
    }

    boldRange(startIndex: number, endIndex: number) {
        this.makeRangeTagged(startIndex, endIndex, "<b>", "</b>");
    }
    underlineRange(startIndex: number, endIndex: number) {
        this.makeRangeTagged(startIndex, endIndex, "<ins>", "</ins>")
    }
    italicizeRange(startIndex: number, endIndex: number) {
        this.makeRangeTagged(startIndex, endIndex, "<i>", "</i>")
    }
    markRange(startIndex: number, endIndex: number) {
        this.makeRangeTagged(startIndex, endIndex, "<mark>", "</mark>")
    }

    performSyntaxHighlighting() {
        //TODO: save and restore cursor location
        this.div.blur();
        this.currentTagCharCount = 0;
        this.internalHTMLState = this.div.innerText;
        this.compiled = compile(this.div.innerText);
        let text_iterator = highlightRegions(this.compiled);
        for (let c of text_iterator) {
            if (c.type == HighlightType.Bold) {
                this.boldRange(c.region.startIndex(), c.region.endIndex());
            }
            else {
                this.underlineRange(c.region.startIndex(), c.region.endIndex());
            }
        }
        this.commit();
    }
}

let poem1 =
`"True friend"
It's not often true that 
I can stand you,
But it's not often true to say
That I can live without you.
 
"False hope"
She has heard many false things 
Has had many empty promises uttered 
into her delicate ears;
But these false hopes of hers 
They come from within-
For despite these dark shadows,
She is a treasure chest
 of childish hopes.
 
"Intersecting"
In life
You develop these 
peculiar 
intersecting paths,
crossed lines 
constantly intersecting 
people
and their paths
But how many of these people 
and their paths 
Do you stop to consider?
 
 
"Union"
His union
Her union
Their unions,
The same between them but with such different weight!
For her it is worth a thousand years' labor 
a million gold coins 
a lifetime of her dedication;
For him it is worth pocket change and a rumpled, unused wedding gown;
The weight of their disjoint love pressing creases into the fabric 
like the deep furrows in the girl’s heart-shattered brow.
 
"Nothing is Lost"
Nothing gained,
Nothing lost –
until all is lost.
 
"One and Only"
I saw one girl, just
one light there in the café–
And I loved her!
Little did I know that 
That girl would have her light
extinguished. 
 
"After all this time"
After many suns have risen 
After night has fallen from countless days 
After time has blurred in a river of liquid memory–
Night is all that remains;
Despite our efforts, 
the many reflections of faces and laughter and 
color
fade into the black night
lost 
to time.
 
"Before the day breaks"
Before day breaks
Before dawn comes
Before gulls shriek their lonely cries,
The dockmaster begins his day.
Long, long before ships start their journey
Before sailors brave the merciless tide
He rises in the dark;
Envious of the sailors, longing to be 
On those ships 
Chasing the dawn
On the cusp of adventure. 
But he knows-
Knows that this is not his call
And that he is bound here
Upon his wooden shore. 
Else, who would rise before them, 
to wave the gulls on their maritime perches
to greet the sun
to sweep and batten and tighten and prepare?
Certainly no other.
It was his task alone.
How, with all that he does and 
all that must be done as he rises before them, 
ready to see them set out to chase the sun?
How could he ask another to take his post? 
He is the watchman. 
He is the crewman 
Who protects the journey 
The waves
The sun
The sea.
Taking his post,
he stares into the blistering wind 
And smiles.
 
"Add some"
Bring water to a boil and add two troubled people
Once done stirring, add some sharp words
Wait for two minutes, or a lifetime if preferred:
The exact amount of time won't matter
after the stewing is done.
Then toss in some hot tears and bitter frowns.
This is the recipe for a 'complicated relationship'.
 
"Difference"
Man has an alarming skill for noticing difference between two things-
Ask him to spot the difference 
When given a pair of two other men,
and then when asked for a response 
before even asking their name or their profession or their beliefs or values,
He can tell you the differences between them with righteous confidence.
That is the folly of man - he loves to divide the indivisible. 
 
"Nothingness"
In the beginning there was nothingness;
Dark 
Cold
Alone
The void called out!
And in the dark,
The nothingness cried-
her false reply to an empty promise.
But the void was foolish-
Weak, he was-
For he wished so longingly for her cry to be true.
 
"Leak in the boat"
My boat has sprung a leak 
Torn against the rocks of spite and 
Run ragged by sharp words!
It is the worst type of leak - 
Patching the hole seems an impossible task, 
A fool's errand - 
As my life-blood rushes out into the nothingness of pain, 
I feel the difference immediately; cold! I am cold! 
But I have found a carpenter who grasps the torn shards with her gentle hands
Soothing the splitters and patching the hole
So that one day 
One day
I may again be able to dance above the cobalt sea. 
 
"Multiple destinations" 
He had multiple ways to get there
And multiple reasons to run
At the bus station, as he parted ways with her, 
he thought
He wanted to leave
To not add to her suffering any longer 
This was the most precious of those reasons 
He thought 
He was just causing her pain.
He wanted to go 
To flee
To leave nothing behind 
Anything he had to do to ensure that 
He left her 
Without ever asking what
She thought.
 
"Same as before"
Same day; same night
The sun-rays and moon-beams intersecting, criss-crossing at the cusp,
A tangled mess at the line where very few leak through-
where day and night try to meet and come together in a mighty crash.
As simple as that mix may sound, the leak of night into day is the moment when 
Dark
Light 
Come together into color.
 
 
“Again and Again”
He dared to venture out again
Explorer met exploration
Alas, again waves of cold contention met his weather-weary ship!
The explorer fought, slamming with a mighty cry into the night, again yelling waves and waves of blunt pain. Yelling.
But he did not falter. 
He saw, there on the horizon 
That shining beacon again calling out to him 
The explorer, 
Fraught with the thirst for that treasure, which was again crying and calling to him
Himself calling and crying out.
Pushed on with unwavering desire.
 
 
“Fact of Your Act“
Again, the fact I rhyme—
even everyday or all the time—
is fine! In fact you might find,
the same were you to change
nothing would be as it once was.
Starts with one but then oh friend,
multiple rhymes you spoke,
I know quite well, my smile will leak my joy—
you will find it swell! That nothing—
oh yes, it’s true—friend why not join me too?
 
“Test the waters”
Try to materialize, in your mind before you go,
the multiple people who came, after her, and after him 
Beyond the one day when they met. it was like the beginning of a story.
Yesterday, they met and after them would come 
Their daughter,
After her would come their son, 
after that his brother, 
after that his child
She was alone 
Until she met the boy
No mother
No father
No sister
Only one remained. 
But from her and him grew the many:
Daughter
Son
Grandchild
A tree of life.
Watered with love.`

const text = new AttributedTextBox(document.getElementById("root")!, poem1);
const play = document.getElementById("play")!.onclick = () => run(text.getInnerText(), text.compiled, false)


// text.reset();
