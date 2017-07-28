
Dload example 

# run

npm install


node test_xxxxxxx.js

# 描叙


test_update_and_memory.js 测试热加载后自动更新模块到所有用到的地方， 同时 测试内存，从结果来看更新成功，内存使用在一个区间波动。



test_multi_rely.js 测试一个模块被多个模块依赖的情况，更新其中一个模块对另外模块的影响。



test_module_with_status.js 测试带状态的模块，看看dload能否尽量保持模块的状态
