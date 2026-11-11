import type { GlobalStyleObject } from "@pandacss/dev";

export const embedStyles: GlobalStyleObject = {
	".link-card": {
		my: "4", // remark-breaksで使うなら上のMarginだけにしたほうがいいかも
		// mb: "-4",  // rehype-breaksによる余分なスペースを相殺
		borderWidth: "1",
		borderColor: "sz.border",
		borderRadius: "lg",
		overflow: "hidden",
		maxH: "200px",
		transition: "background-color 0.1s ease",
		bg: "sz.bg",
		_hover: {
			bg: "sz.bg-on.500",
		},
		_sm: {
			flexDirection: "column",
			maxH: "none",
			w: "full",
			maxW: "full",
		},
		a: {
			display: "flex",
			textDecoration: "row",
			w: "full",
			h: "full",
			color: "sz.text.main",
			transition: "color 0.2s ease",
			_sm: {
				flexDirection: "column",
			},
			_hover: {
				textDecoration: "none",
			},
			".link-card-image": {
				display: "flex",
				flexShrink: "0",
				w: "auto",
				h: "200px",
				overflow: "hidden",
				alignItems: "center",
				justifyContent: "center",
				_sm: {
					w: "full",
					h: "200px",
				},
				img: {
					w: "full",
					h: "full",
					objectFit: "cover",
					objectPosition: "center",
					m: "0",
					rounded: "0",
					maxH: "250px",
				},
			},
		},
		"&.link-card-no-image": {
			maxH: "120px",
			a: {
				".link-card-image": {
					h: "120px",
					_sm: {
						display: "none",
					},
				},
			},
			".link-card-content": {
				py: "3",
			},
		},
		"&.wide-image": {
			a: {
				".link-card-image": {
					w: "350px",
					h: "200px",
					_sm: {
						w: "full",
					},
					img: {
						objectPosition: "center",
					},
				},
			},
		},
		".link-card-content": {
			display: "flex",
			px: "4",
			pt: "4",
			pb: "3.5",
			flexDirection: "column",
			justifyContent: "flex-start",
			flex: "1",
			minW: "0",
			maxW: "100%",
			overflow: "hidden",
			wordBreak: "break-word",
			_sm: {
				w: "full",
			},
			".link-card-title": {
				display: "-webkit-box",
				"-webkit-box-orient": "vertical",
				"-webkit-line-clamp": "3",
				textOverflow: "hidden",
				overflow: "hidden",
				m: "0",
				mb: "2",
				fontSize: "16px",
				fontWeight: "bold",
				lineHeight: "1.4",
				color: "sz.text.main",
				_sm: {
					"-webkit-line-clamp": "2",
					mb: "1",
				},
			},
			".link-card-description": {
				mb: "2",
				display: "-webkit-box",
				"-webkit-box-orient": "vertical",
				textOverflow: "hidden",
				overflow: "hidden",
				fontSize: "12px",
				"-webkit-line-clamp": "2",
				_sm: {
					"-webkit-line-clamp": "1",
				},
			},
			".link-card-site-wrapper": {
				mt: "auto",
				display: "flex",
				alignItems: "flex-start",
				gap: "2",
				img: {
					m: "0",
					rounded: "0",
				},
			},
		},
		".link-card-favicon": {
			w: "4",
			h: "4",
			objectFit: "contain",
			flexShrink: "0",
		},
		".link-card-favicon-fallback": {
			w: "4",
			h: "4",
			flexShrink: "0",
			color: "sz.text.sub",
		},
		".link-card-site": {
			display: "flex",
			fontSize: "xs",
			color: "sz.text.sub",
			fontFamily: "var(--moralerspace-neon)",
		},
	},
	".link-card-grid": {
		".link-card-grid-container": {
			display: "flex",
			flexDirection: "row",
			gap: "2",
			overflow: "hidden",
			height: "full",
			_sm: {
				flexDirection: "column",
			},
		},
		".link-card-image-container": {
			display: "flex",
			flexShrink: "0",
			w: "auto",
			h: "200px",
			overflow: "hidden",
			alignItems: "center",
			justifyContent: "center",
			_sm: {
				w: "full",
				h: "250px",
			},
			img: {
				w: "full",
				h: "full",
				objectFit: "cover",
				objectPosition: "center",
				m: "0",
				rounded: "0",
			},
		},
		".no-image": {
			w: "full",
			h: "full",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			bg: "sz.bg-on",
			color: "sz.border",
			fontSize: "0.8rem",
		},
	},
	".youtube-embed, .youtube-shorts-embed": {
		my: "4",
		display: "flex",
		justifyContent: "center",
		maxW: "full",
	},
	".youtube-embed": {
		aspectRatio: "16 / 9",
	},
	".youtube-shorts-embed": {
		aspectRatio: "9 / 16",
		w: "full",
		maxW: "360px",
		rounded: "xl",
		overflow: "hidden",
		mx: "auto",
	},

	".spotify-embed iframe": {
		w: "full",
		h: "full",
		aspectRatio: "2 / 1",
		minW: "300px",
		maxW: "800px",
	},

	".twitter-embed-container": {
		m: "1rem 0",
		w: "full",
		display: "block",
		"&[hidden]": {
			display: "none",
		},
		"& [data-twitter-embed]": {
			display: "block",
			w: "full",
			maxW: "550px",
			mx: "auto",
			"& a": {
				display: "inline-flex",
				justifyContent: "center",
				alignItems: "center",
				w: "full",
				px: "4",
				py: "3",
				borderWidth: "1",
				borderColor: "sz.border",
				borderRadius: "md",
				bg: "sz.bg-on",
				color: "sz.text.main",
				textDecoration: "none",
			},
		},
	},

	".google-slides-wrapper": {
		display: "flex",
		justifyContent: "center",
		m: "1.5rem 0",
		w: "full",
	},

	".google-slides-container": {
		w: "full",
		position: "relative",
		paddingBottom: "58.23%", // 12:7 aspect ratio (7 / 12 * 100)
		maxW: "960px",
		h: "0",
		overflow: "hidden",
		bgColor: "sz.bg-on",
		iframe: {
			position: "absolute",
			top: "0",
			left: "0",
			w: "full",
			h: "full",
			border: "0",
			rounded: "8px",
		},
	},

	".github-gist-embed-container": {
		m: "1.5rem 0",
		w: "full",
		overflowX: "auto",
		".gist": {
			m: "0",
		},
		".github-meta": {
			fontFamily: "inherit",
		},
	},
	"iframe[src*='open.spotify.com']": {
		w: "full",
		h: "full",
		aspectRatio: "2 / 1",
		minW: "300px",
		maxW: "800px",
		border: "0",
		rounded: "8px",
		p: "0.5rem 0",
	},
	".hatena-blog-embed, .note-embed, .twitter-embed": {
		display: "flex",
		justifyContent: "center",
	},
	".speaker-deck-embed": {
		my: "4",
	},
};
