const theme = {
  themeName: 'dbgate-plugin-theme-total-white',
  themeType: 'light',
  themeClassName: 'theme-dbgate-plugin-theme-total-white',
  themeCss: `
	.theme-dbgate-plugin-theme-total-white {
		--theme-font-1: #000000;
		--theme-font-2: #4d4d4d;
		--theme-font-3: #808080;
		--theme-font-4: #b3b3b3;
		--theme-font-hover: #061178;
		--theme-font-link: #10239e;        
		--theme-font-alt: #135200;

		--theme-bg-0: #fff;
		--theme-bg-1: #ffffff;
		--theme-bg-2: #F8f8f8;
		--theme-bg-3: #ddd;
		--theme-bg-4: #ccc;
		--theme-bg-alt: #f0f5ff;
		
    --theme-bg-gold: #fff1b8;
		--theme-bg-orange: #ffe7ba;
		--theme-bg-green: #d9f7be;
		--theme-bg-volcano: #ffd8bf;
		--theme-bg-red: #ffccc7;
		--theme-bg-blue: #91d5ff;
		--theme-bg-magenta: #ffadd2;

		--theme-font-inv-1: #ffffff;
		--theme-font-inv-15: #dedede;
		--theme-font-inv-2: #b3b3b3;
		--theme-font-inv-3: #808080;
		--theme-font-inv-4: #4d4d4d;

		--theme-bg-inv-1: #222;
		--theme-bg-inv-2: #3c3c3c;
		--theme-bg-inv-3: #565656;
		--theme-bg-inv-4: #707070;

		--theme-border: #ddd;

		--theme-bg-hover: #bae7ff;
		--theme-bg-selected: #91d5ff;
		--theme-bg-selected-point: #40a9ff;

		--theme-bg-statusbar-inv: #0050b3;
		--theme-bg-statusbar-inv-hover: #096dd9;
		--theme-bg-statusbar-inv-font: #222;
		--theme-bg-statusbar-inv-bg: #ccc;
		--theme-bg-modalheader: #fff;

		--theme-bg-button-inv: #337ab7;
		--theme-bg-button-inv-2: #4d8bc0;
		--theme-bg-button-inv-3: #679cc9;

		--theme-icon-blue: #096dd9;
		--theme-icon-green: #237804;
		--theme-icon-red: #cf1322;
		--theme-icon-gold: #d48806;
		--theme-icon-yellow: #d4b106;
		--theme-icon-magenta: #c41d7f;
		--theme-icon-inv-green: #8fd460;
		--theme-icon-inv-red: #e84749;
	}
	.outer.svelte-1dacrl4 {
		background: #FFF;
	}
	body *::-webkit-scrollbar-track {
		background-color: #eee;
	}
	.tabs {
		background-color: #f7f7f7
	}
	.file-tab-item svelte selected {
		background-color: #f2f3f5;
	}
	.iconbar {
		background: #FFF !important;
	}
	.iconbar .main {
		border-right: 1px solid #DDD;
	}
	.iconbar .wrapper {
		cursor: pointer;
		height: 50px;
		color: #BBB;
	}
	.iconbar .wrapper.selected,
	.iconbar .wrapper:hover {
		color: #0e0e0e;
		background: transparent;
	}
	.iconbar .mdi {
		transition: all 300ms;
		font-size: 1.7rem !important;
		background: #f8f8f8 !important;
	}
	.main-container {
		background: #FEFEFE;
	}
	.dropDownMenuMarker li {
		cursor: pointer;
	}
	.dropDownMenuMarker a:hover {
		background: #EEE !important;
	}`,
};
n.default = { themes: [r] };
