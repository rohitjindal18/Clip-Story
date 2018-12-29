import React from 'react';
import './index.css';
import Player from '../Player';
const touchDuration = 500;

const defaultState = {
    active: 0,
    isSwiping: false,
    swipeStart: false,
    userPaused: false
};
const state = (state = defaultState, action) => {
    switch(action.type) {
        case 'SWIPE_START':
            return {
                ...state,
                swipeStart: true
            };
        case 'SWIPE_MOVE':
            return {
                ...state,
                isSwiping: true
            };
        case 'SWIPE_END': {
            return {
                ...state,
                isSwiping: false
            };
        }
        case 'INCREMENT_ACTIVE_VIDEO': {
            return {
                ...state,
                active: state.active + 1
            };
        }
        case 'USER_PAUSED': {
            return {
                ...state,
                userPaused: action.payload
            }
        }
        default:
            return state;
    }
}

const allVideos = [
    {
        autoplay: true,
        sources: [
            {
            type: "video/webm",
            src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            }
        ]
    },
    {
        autoplay: true,
        sources: [
        {
            type: "video/webm",
            src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        }
    ]
    },
    {
        sources: [
            {
                type: "video/webm",
                src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
            }
        ]
    }
];

export default class Story extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            active: 0,
            isSwiping: false
        };
        this.swipeStart = 0;
        this.swipeEnd = 0;
        this.tappedTwice = null;
        this.playerObj = {};
    }

    componentWillUnmount() {
        this.playerObj.shutdown();
    }

    setPlayer = (player) => {
        this.playerObj = player;
    }

    onVideoClick = (e) => {
        const {
            clientX
        } = e;

        if (!this.tappedTwice) {
            this.tappedTwice = setTimeout(() => {
                this.tappedTwice = null;
                const windowWidth = window.innerWidth;
                if (this.state.active === 0) {
                    this.setState(state(this.state, {
                        type: 'INCREMENT_ACTIVE_VIDEO'
                    }), () => {
                        this.playerObj.resume();
                    });
                } else {
                    if (this.state.userPaused) {
                        this.playerObj.resume();
                        this.setState(state(this.state, {
                            type: 'USER_PAUSED',
                            payload: false
                        }), () => {
                            this.playerObj.resume();
                        });
                    } else {
                        const currentSeek = this.playerObj.video && this.playerObj.video.time;
                        if (clientX > windowWidth / 2) {
                            this.playerObj.seek(currentSeek + 5); 
                        } else {
                            this.playerObj.seek(currentSeek - 5);
                        }
                    }
                }
            }, 300);
        } else {
            clearTimeout(this.tappedTwice);
            this.tappedTwice = null;
            alert("heart");
        }
    }


    onTouchStart = (e) => {
        this.swipeStart = (e.changedTouches && e.changedTouches[0].clientX) || 0;
        this.startSwipeTime = Date.now();
    }

    onTouchMove = (e) => {
        this.setState(state(this.state, {
            type: 'SWIPE_MOVE'
        }));
    }

    onTouchEnd = (e) => {
        debugger;
        this.endSwipeTime = Date.now();
        if (this.endSwipeTime - this.startSwipeTime > touchDuration) {
            this.setState(state(this.state, {
                type: 'USER_PAUSED',
                payload: true
            }), () => {
                this.playerObj.pause();
            });
            return;
        }
        this.swipeEnd = (e.changedTouches && e.changedTouches[0].clientX) || 0;
        const {
            isSwiping
        } = this.state; 
        if (isSwiping) {
            if (this.swipeStart > this.swipeEnd) {
                this.playerObj.next();
            } else {
                this.playerObj.prev();
            }
            this.setState(state(this.state, {
                type: 'SWIPE_END'
            }));
        }
    }

    onContextMenuClick = (e) => {
        e.preventDefault();
    }

    render() {
        return(
            <div 
                className='mainDiv' 
                onTouchStart={this.onTouchStart}
                onTouchEnd={this.onTouchEnd}
                onTouchMove={this.onTouchMove}
                onContextMenu={this.onContextMenuClick}
                onClick={this.onVideoClick}>
                <Player
                    videos={allVideos} 
                    userPaused={this.state.userPaused}
                    setPlayer={this.setPlayer}
                />
            </div>
        );
    }
}