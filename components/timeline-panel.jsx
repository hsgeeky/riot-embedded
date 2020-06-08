import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import EventTile from './event-tile.jsx';
import ThemeContext from './theme-context.jsx';

/**
 * React component for the room timeline
 * 
 * @param   {string} homeserver - The homeserver URL
 * @param   {object} room - The room object
 * @param   {object} client - The client object
 * @param   {object} children - Children of room timeline
 */
export default class TimelinePanel extends PureComponent {
    static propTypes = {
        homeserver: PropTypes.string.isRequired, // Homeserver URL
        room: PropTypes.object, // Room object
        client: PropTypes.object, // Client object
        children: PropTypes.object // Children of the room body
    };

    constructor(props) {
        super(props);

        this.oldRoomId = this.props.room ? this.props.room.roomId : null;

        this.loadPrevious = this.loadPrevious.bind(this);
        this.onScroll = this.onScroll.bind(this);
    }

    componentDidUpdate() {
        if ( !(this.props.room) ) return;
        let timelineBody = document.getElementById('timeline-body');
        
        // Scroll to bottom on room change
        if ( this.props.room.roomId !== this.oldRoomId ) {
            let height = timelineBody.clientHeight;
            timelineBody.scrollTop += height + 999999;
            this.oldRoomId = this.props.room.roomId;   
        }

        // Load messages if timeline not filled
        if (timelineBody.scrollTop <= 0) {
            let height = timelineBody.clientHeight;
            this.loadPrevious(height);
        }
    }

    /** Load older messages */
    loadPrevious(oldHeight) {
        let loader = document.getElementById('timeline-loading');
        
        // Hide loader if at end of timeline
        if (this.props.room.oldState.paginationToken == null) {
            loader.style.display = 'none';
            return;
        }

        // Show loader
        loader.style.display = 'block';
        
        this.props.client.scrollback(this.props.room, 30, () => {
            // Hide loader
            loader.style.display = 'none';

            let timelineList = document.getElementById('timeline-list');
            let newHeight = timelineList.clientHeight;

            // Only if not already at the top of timeline
            if (newHeight !== oldHeight) {
                let timelineBody = document.getElementById('timeline-body');
                
                // Scroll to original position (position += diff in height)
                timelineBody.scrollTop += timelineList.clientHeight - oldHeight;
                
                // If scrolled to top or not fully scrolled to top
                if (timelineBody.scrollTop <= 0) {
                    this.loadPrevious(newHeight);
                }
            }
        });
    }

    /** Check if scrolled to top of timeline */
    onScroll(event) {
        let timelineBody = event.target;
        // Get old height
        let timelineList = document.getElementById('timeline-list');
        let oldHeight = timelineList.clientHeight;
        if (timelineBody.scrollTop <= 0) {
            this.loadPrevious(oldHeight);
        }
    }

    // Consume theme context
    static contextType = ThemeContext;
    render() {
        let theme = this.context;

        // Construct timeline from room
        let timeline = [];
        if (this.props.room) {
            for (let event of this.props.room.timeline) {
                timeline.push(
                    <EventTile key={event.event.event_id} 
                        homeserver={this.props.homeserver}
                        mxEvent={event} client={this.props.client} />
                ); 
            }
        }
        
        return (
            <div className='main-body'>
                <div className={
                    `bg-primary-${theme.theme} body-panel scrollable-${theme.theme}`
                } onScroll={this.onScroll} id='timeline-body' >
                    <div className='loader-panel'>
                        <div id='timeline-loading' className={`loader-${theme.theme}`}></div>
                    </div>
                    <ul className='list-panel' id='timeline-list' >
                        {timeline}
                    </ul>
                </div>
                {this.props.children}
            </div>
        );
    }
}