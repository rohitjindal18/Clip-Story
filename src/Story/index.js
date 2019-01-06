import React from 'react';
import './index.css';
import Player from '../Player';
import forwardIcon from '../resources/fast-forward.svg';
const touchDuration = 500;

const defaultState = {
    active: 0,
    isSwiping: false,
    swipeStart: false,
    userPaused: false,
    progress: 0
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
                active: +action.payload
            };
        }
        case 'USER_PAUSED': {
            return {
                ...state,
                userPaused: action.payload
            }
        }
        default:
            return {};
    }
}

export default class Story extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            active: 0,
            isSwiping: false,
            videos: []
        };
        this.swipeStart = 0;
        this.swipeEnd = 0;
        this.tappedTwice = null;
        this.playerObj = {};
        this.videoDuration = 0;
        this.previousSeekedTime = 0;
        this.initializeCaching();
    }

    initializeCaching = () => {
        this.cachedVideoFirst =  document.createElement('link');
        this.cachedVideoSecond =  document.createElement('link');
        this.cachedVideoFirst.rel = 'preload';
        this.cachedVideoSecond.rel = 'preload';
        this.cachedVideoFirst.as = 'video';
        this.cachedVideoSecond.as = 'video';
        document.head.append(this.cachedVideoFirst);
        document.head.append(this.cachedVideoSecond);
    }

    cacheFallback = (video, index) => {
        if (index === 1) {
            this.cachedVideoSecond.href = video.url;
        } else if (index === 0) {
            this.cachedVideoFirst.href = video.url;
        }
    }

    cacheVideo = (videos) => {
        window.caches.open('video-pre-cache')
            .then(cache => Promise.all(videos.map(videoFileUrl => fetchAndCache(videoFileUrl, cache))));

            function fetchAndCache(videoFileUrl, cache) {
            // Check first if video is in the cache.
            return cache.match(videoFileUrl)
            .then(cacheResponse => {
                // Let's return cached response if video is already in the cache.
                if (cacheResponse) {
                    return cacheResponse;
                }
                // Otherwise, fetch the video from the network.
                return fetch(videoFileUrl, { headers: {mode: 'no-cors', range: 'bytes=0-567139' } })
                    .then(networkResponse => networkResponse.arrayBuffer())
                    .then(data => {
                    // Add the response to the cache and return network response in parallel.
                    const response = new Response(data);
                    cache.put(videoFileUrl, response.clone());
                    return response;
                });
            });
        }
    }

    componentDidMount() {
        this.videosCached = [];
        fetch("https://klipply.com/api/v1/slices").then(resp => resp.json()).then(response => {
            const videos = (response.videos || []).map((video, index) => {
                this.cacheFallback(video, index);
                this.videosCached.push(video.url);
                return {
                    autoplay: true,
                    preload: 'auto',
                    sources: [
                        {
                            type: 'video/webm',
                            src: video.url,
                            preload: 'auto'
                        }
                    ]
                }
            });
            this.setState({
                videos
            });
        }).then(() => {
            // this.cacheVideo(videosCached);
        });
    }

    componentWillUnmount() {
        this.playerObj.shutdown();
    }

    setPlayer = (player) => {
        this.playerObj = player;
        this.videoDuration = player.video.duration;
        this.transValue = (100 / this.videoDuration) * 1.248745;
        this.progressBar.style.transform = `translateX(-${100}%)`;
        this.progressBar.style.willChange = 'transform';
        this.previousSeekedTime = 0;
    }

    setProgressBarRef = (barRef) => {
        this.progressBar = barRef;
    }

    onVideoClick = (e) => {
        const {
            clientX
        } = e;

        if (!this.tappedTwice) {
            this.tappedTwice = setTimeout(() => {
                this.tappedTwice = null;
                const windowWidth = window.innerWidth;
                if (this.state.active === 0 && !this.playerObj.playing) {
                    this.playerObj.resume();
                } else {
                    if (this.state.userPaused) {
                        this.setState(state(this.state, {
                            type: 'USER_PAUSED',
                            payload: false
                        }), () => {
                            this.playerObj.resume();
                        });
                    } else {
                        const currentSeek = this.playerObj.video && this.playerObj.video.time;
                        if (clientX > windowWidth / 2) {
                            this.forward.classList.add('forward-a');
                            this.playerObj.seek(currentSeek + 5); 
                            const component = this;
                            setTimeout(() => {
                                component.forward.classList.remove('forward-a');
                            }, 500);
                        } else {
                            this.rewind.classList.add('rewind-a');
                            this.playerObj.seek(currentSeek - 5);
                            const component = this;
                            setTimeout(() => {
                                component.rewind.classList.remove('rewind-a');
                            }, 500);
                        }
                    }
                }
            }, 300);
        } else {
            clearTimeout(this.tappedTwice);
            this.tappedTwice = null;
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
                this.progressBar.classList.remove('animate');
                this.setState(state(this.state, {
                    type: 'INCREMENT_ACTIVE_VIDEO',
                    payload: this.state.active === this.state.videos.length - 1 ? 0 : this.state.active + 1
                }), () => {
                    this.playerObj.load(this.state.videos[this.state.active]);  
                    this.cacheFallback({url: this.videosCached[this.state.active + 1]}, 0);
                    this.cacheFallback({url: this.videosCached[this.state.active + 2]}, 1);
                });
            } else {
                this.progressBar.classList.remove('animate');
                this.setState(state(this.state, {
                    type: 'INCREMENT_ACTIVE_VIDEO',
                    payload: this.state.active ? this.state.active - 1 : 0
                }), () => {
                    this.playerObj.load(this.state.videos[this.state.active]);   
                });
            }
            this.setState({
                isSwiping: false
            });
        }
    }

    onContextMenuClick = (e) => {
        e.preventDefault();
    }

    onVideoFinished = (root) => {
        this.progressBar.classList.remove('animate');
        this.setState(state(this.state, {
            type: 'INCREMENT_ACTIVE_VIDEO',
            payload: this.state.active === this.state.videos.length - 1 ? 0 : this.state.active + 1
        }), () => {
            this.playerObj.load(this.state.videos[this.state.active]);
        });
    }

    setParentPlayer = (ref) => {
        this.parentPlayer = ref;
    }

    onProgress = (root, time) => {
        if (!this.progressBar.classList.contains('animate')) {
            this.progressBar.classList.add('animate');
        }
        const translatePosition = this.progressBar.style.transform;
        const currentTranslatedPosition = translatePosition.replace(/[^\d.]/g, '');
        if (this.previousSeekedTime) {
            this.transValue = (100 / this.videoDuration) * (time - this.previousSeekedTime);
        }
        const toBeTranslated = (currentTranslatedPosition - this.transValue) < 5 ? 0 : 
            (currentTranslatedPosition - this.transValue);
        this.progressBar.style.transform = 
            `translateX(-${toBeTranslated}%)`;
        this.previousSeekedTime = time;
    }

    rewindRef = (ref) => {
        this.rewind = ref;
    }

    forwardRef = (ref) => {
        this.forward = ref;
    }

    render() {
        return(
            <React.Fragment>
                <div className='progress-bar'>
                    <span ref={this.setProgressBarRef} className='progress-span'></span>
                </div>
                <div className='actions'>
                    <div className='action-rewind' ref={this.rewindRef}>
                        <img className='rewind icon-action' src={forwardIcon} alt='forward'/>
                    </div>  
                    <div className='action-forward' ref={this.forwardRef}>
                        <img className='icon-action' src={forwardIcon} alt='forward' />
                    </div>  
                </div>
                <div 
                    ref={this.setParentPlayer}
                    className='mainDiv' 
                    onTouchStart={this.onTouchStart}
                    onTouchEnd={this.onTouchEnd}
                    onTouchMove={this.onTouchMove}
                    onContextMenu={this.onContextMenuClick}
                    onClick={this.onVideoClick}>
                    { 
                        this.state.videos.length > 0 ?
                        <Player
                            videos={this.state.videos} 
                            userPaused={this.state.userPaused}
                            setPlayer={this.setPlayer}
                            onVideoFinished={this.onVideoFinished}
                            onProgress={this.onProgress}
                        /> : null 
                    }
                </div>
            </React.Fragment>
        );
    }
}