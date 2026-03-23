// components/publish-stepper/publish-stepper.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 步骤数据
    steps: {
      type: Array,
      value: []
    },
    // 当前步骤索引
    currentStep: {
      type: Number,
      value: 0
    },
    // 是否可编辑当前步骤
    editable: {
      type: Boolean,
      value: false
    },
    // 是否允许点击跳转
    clickable: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 步骤点击事件
     */
    onStepTap(e) {
      if (!this.data.clickable) {
        return;
      }
      
      const stepIndex = e.currentTarget.dataset.step;
      const currentStep = this.data.currentStep;
      
      // 只允许点击已完成的步骤或当前步骤
      if (stepIndex <= currentStep) {
        this.triggerEvent('stepchange', {
          step: stepIndex,
          direction: stepIndex < currentStep ? 'prev' : 'current'
        });
      }
    },

    /**
     * 下一步
     */
    nextStep() {
      const currentStep = this.data.currentStep;
      const totalSteps = this.data.steps.length;
      
      if (currentStep < totalSteps - 1) {
        const nextStep = currentStep + 1;
        this.setData({
          currentStep: nextStep
        });
        
        this.triggerEvent('stepchange', {
          step: nextStep,
          direction: 'next'
        });
      }
    },

    /**
     * 上一步
     */
    prevStep() {
      const currentStep = this.data.currentStep;
      
      if (currentStep > 0) {
        const prevStep = currentStep - 1;
        this.setData({
          currentStep: prevStep
        });
        
        this.triggerEvent('stepchange', {
          step: prevStep,
          direction: 'prev'
        });
      }
    },

    /**
     * 跳转到指定步骤
     */
    goToStep(stepIndex) {
      const totalSteps = this.data.steps.length;
      
      if (stepIndex >= 0 && stepIndex < totalSteps) {
        const currentStep = this.data.currentStep;
        this.setData({
          currentStep: stepIndex
        });
        
        this.triggerEvent('stepchange', {
          step: stepIndex,
          direction: stepIndex > currentStep ? 'next' : 'prev'
        });
      }
    },

    /**
     * 完成当前步骤
     */
    completeStep() {
      this.triggerEvent('stepcomplete', {
        step: this.data.currentStep
      });
    },

    /**
     * 重置步骤器
     */
    reset() {
      this.setData({
        currentStep: 0
      });
      
      this.triggerEvent('stepreset');
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件实例被放入页面节点树时执行
    },
    
    detached() {
      // 组件实例被从页面节点树移除时执行
    }
  }
});