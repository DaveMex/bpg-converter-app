#include "encoder_wrapper.h"
#include <iostream>
#include <sstream>
#include <cstdlib>

EncoderWrapper::EncoderWrapper() {
}

EncoderWrapper::~EncoderWrapper() {
}

bool EncoderWrapper::encodeBPG(const std::string& inputFilename, const std::string& outputFilename, const std::string& options) {
    std::stringstream command;
    command << "bpgenc " << options << " -o " << outputFilename << " " << inputFilename;

    std::cout << "Executing: " << command.str() << std::endl;

    int result = std::system(command.str().c_str());

    if (result == 0) {
        return true;
    } else {
        std::cerr << "Error: bpgenc command failed with code: " << result << std::endl;
        return false;
    }
}
