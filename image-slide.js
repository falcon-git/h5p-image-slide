var H5P = H5P || {};

H5P.ImageSlide = (function ($) {
  /**
   * Constructor function.
   */
  function C(options, contentId, extras) {
    var self = this;
    this.$ = $(this);
    H5P.EventDispatcher.call(this);

    // Define checkOverflow as a method of the instance (we use CSS to hide the toggle button)
    this.checkOverflow = function () {
      if (self.$descriptionTextContainer && self.$descriptionTextContainer[0].scrollHeight > self.$descriptionTextContainer[0].clientHeight) {
        self.$toggleButton.show();
      } else if (self.$toggleButton) {
        self.$toggleButton.hide();
      }
    };

    // Listen resize events
    this.on('resize', () => {
      this.checkOverflow();
    });

    this.aspectRatio = this.originalAspectRatio = extras.aspectRatio;
    // Extend defaults with provided options
    this.options = $.extend(true, {}, {
      image: null,
      description: ''
    }, options);
    // Keep provided id.
    this.contentId = contentId;

    this.image = H5P.newRunnable(this.options.image, this.contentId);
    this.image.on('loaded', function () {
      self.trigger('loaded');
      self.trigger('resize');
    });
    this.description = this.options.description;
  }

  C.prototype = Object.create(H5P.EventDispatcher.prototype);
  C.prototype.constructor = C;

  /**
   * Attach function called by H5P framework to insert H5P content into
   * page
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    this.$container = $container;

    // Set class on container to identify it as an image slide container.
    $container.addClass("h5p-image-slide");

    this.$imageHolder = $('<div>', {
      class: 'h5p-image-slide-image-holder',
    });

    $container.append(this.$imageHolder);

    // Add image
    this.image.attach(this.$imageHolder);

    // Add description if it exists
    if (this.description) {
      // Create description element
      const $description = $('<div>', {
        class: 'h5p-image-description',
      }).appendTo($container);

      // Create toggle button within the description element and store it in the instance
      this.$toggleButton = $('<div>', {
        class: 'h5p-description-toggle',
        'aria-label': 'Toggle description',
        role: 'button',
      }).appendTo($description).hide(); // Initially hide the toggle button

      // Create an arrow icon inside the toggle button for independent rotation
      this.$arrowIcon = $('<div>', {
        class: 'arrow-icon',
        css: {
          'transform': 'rotate(180deg)'
        }
      }).appendTo(this.$toggleButton);

      // Create the description text container and store it in the instance
      this.$descriptionTextContainer = $('<div>', {
        class: 'h5p-description-text-container',
        text: this.description
      }).appendTo($description);

      // Set initial state for description visibility
      $description.addClass('collapsed');
      $description.css({
        'display': '-webkit-box',
        'max-height': '2.5em',
        'overflow': 'visible',
        '-webkit-box-orient': 'vertical',
        '-webkit-line-clamp': 2,
      });

      // Run checkOverflow after the element is attached to the DOM
      setTimeout(() => this.checkOverflow(), 0);

      // Toggle function to expand/collapse description
      const toggleDescription = () => {
        const isCollapsed = $description.hasClass('collapsed');
        $description.toggleClass('collapsed', !isCollapsed);
        console.log('isCollapsed', isCollapsed);
        if (isCollapsed) {
          // Expand description
          $description.css({
            'display': 'block',
            'max-height': 'none',
            'overflow': 'visible',
          });
          this.$toggleButton.attr('aria-label', 'Collapse description');

          // Rotate only the arrow icon when expanded
          this.$arrowIcon.css({
            'transform': 'rotate(0deg)',
          });
        } else {
          // Collapse description
          $description.css({
            'display': '-webkit-box',
            'max-height': '2.5em',
          });
          this.$toggleButton.attr('aria-label', 'Expand description');

          // Reset the arrow icon rotation when collapsed
          this.$arrowIcon.css({
            'transform': 'rotate(180deg)',
          });
        }
      };

      // Bind the toggle function to both the toggle button and the description text
      this.$toggleButton.on('click', toggleDescription);
      this.$descriptionTextContainer.on('click', toggleDescription);
    }

    this.adjustSize();
  };

  /**
   * Set the aspect ratio for this slide
   *
   * @param {Integer} newAspectRatio the aspect ratio
   */
  C.prototype.setAspectRatio = function (newAspectRatio) {
    this.aspectRatio = newAspectRatio;
    // Adjust size if image has been attached
    if (this.$imageHolder) {
      this.adjustSize();
    }
  };

  /**
   * Reset the aspect ratio to the previously set aspect ratio
   *
   * Typically used when exiting fullscreen mode
   */
  C.prototype.resetAspectRatio = function () {
    this.aspectRatio = this.originalAspectRatio;
    // Adjust size if image has been attached
    if (this.$imageHolder) {
      this.adjustSize();
    }
  };

  /**
   * Update the size of the slide
   *
   * Typically used when the screen resizes, goes to fullscreen or similar
   */
  C.prototype.adjustSize = function () {
    var imageHeight = this.options.image.params.file.height;
    var imageWidth = this.options.image.params.file.width;

    var imageAspectRatio = imageWidth / imageHeight;
    if (this.aspectRatio >= imageAspectRatio) {
      // image too tall - Make it smaller and center it
      var widthInPercent = imageAspectRatio / this.aspectRatio * 100;
      var borderSize = (100 - widthInPercent) / 2 + '%';
      this.$imageHolder.css({
        height: '100%',
        width: imageAspectRatio / this.aspectRatio * 100 + '%',
        paddingLeft: borderSize,
        paddingRight: borderSize,
        paddingTop: 0,
        paddingBottom: 0
      });
    }
    else if (this.aspectRatio < imageAspectRatio) {
      // image too wide
      var heightInPercent = this.aspectRatio / imageAspectRatio * 100;

      // Note: divide by aspect ratio since padding top/bottom is relative to width
      var borderSize = (100 - heightInPercent) / 2 / this.aspectRatio + '%';

      this.$imageHolder.css({
        width: '100%',
        height: heightInPercent + '%',
        paddingTop: borderSize,
        paddingBottom: borderSize,
        paddingLeft: 0,
        paddingRight: 0
      });
    }
    else if (this.aspectRatio === undefined) {
      this.$imageHolder.css({
        width: '100%',
        height: '',
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0
      });
    }
  };

  return C;
})(H5P.jQuery);
