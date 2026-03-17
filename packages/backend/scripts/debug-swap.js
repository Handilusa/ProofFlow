import { ethers } from "ethers";

async function main() {
    const rpcUrl = "https://testnet.hashio.io/api";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const iface = new ethers.Interface([
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable"
    ]);

    const path = [
        "0x0000000000000000000000000000000000000072", // WHBAR
        "0x000000000000000000000000000000000000371a"  // SAUCE (Mock)
    ]; 
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const minOutWei = ethers.parseUnits("1.0", 8);

    const toAddress = "0xe359A2136a1e13Ec9602e8466354cdCb19fd7EeE";

    const data = iface.encodeFunctionData("swapExactETHForTokens", [minOutWei, path, toAddress, deadline]);

    const tx = {
        to: "0x45e5b52bf445f1bbbba0c3ade4b8ca17c733c4e3",
        value: ethers.parseEther("5"),
        data: data,
        from: toAddress
    };

    try {
        console.log("Estimating gas...");
        const gasLimit = await provider.estimateGas(tx);
        console.log("Gas limit:", gasLimit.toString());
    } catch (e) {
        console.error("Simulation Reverted!");
        console.error(e.message);
    }
}

main();
