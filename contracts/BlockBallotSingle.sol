// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "hardhat/console.sol";

/**
 * @title BlockBallot Election Contract (Single Choice)
 * @dev This contract handles the record of a full election, and the votes cast,
 *  including multiple positions and their respective candidates.
 */
contract BlockBallotSingle {
    address public immutable i_owner; // our backend relayer wallet

    // persistent data structures for the election
    mapping(string => mapping(string => uint256)) public votes; // e.g. tallies["President"]["Alice"] = 10
    mapping(string => mapping(string => bool)) public isCandidate; // e.g. isCandidate["President"]["Alice"] = true
    string[] public positionList; // e.g. ["President", "VP"]
    mapping(string => string[]) public candidateList; // e.g. candidateList["President"] = ["Alice", "Bob"]

    // event for confirming that the vote has been recorded
    event VoteCast(address indexed relayer, string position, string candidate);
    
    /**
     * @dev Constructor runs once on deployment.
     * It sets up the entire election structure from the form.
     * We use a "parallel arrays" pattern to pass the data.
     *
     * @param _positionNames ["President", "VP"]
     * @param _candidatesForPosition [ ["Alice", "Bob"], ["Charlie", "David"] ]
     */
    constructor(string[] memory _positionNames, string[][] memory _candidatesForPosition) {
        i_owner = msg.sender; // Set the backend relayer wallet as owner so only our backend can call the vote function

        require(_positionNames.length == _candidatesForPosition.length, "Input array length mismatch");

        // iterate over each position
        for (uint i = 0; i < _positionNames.length; i++) {
            string memory positionName = _positionNames[i];
            positionList.push(positionName); // add position to list

            // iterate over candidates for this position
            string[] memory candidates = _candidatesForPosition[i];
            require(candidates.length > 0, "Position must have candidates");
            for (uint j = 0; j < candidates.length; j++) {
                string memory candidateName = candidates[j];
                // init vote count to 0
                votes[positionName][candidateName] = 0; 
                // add candidate to mapping/list
                isCandidate[positionName][candidateName] = true; 
                candidateList[positionName].push(candidateName);
            }
        }
    }

    /**
     * @dev The main 'vote' function, called by our Relayer.
     * Now takes TWO arguments.
     */
    function vote(string memory positionName, string memory candidateName) public {
        // Only our server (the owner) can call this
        require(msg.sender == i_owner, "Only the owner (relayer) can call this.");
        
        // Check if this is a valid candidate for the position
        require(isCandidate[positionName][candidateName] == true, "Not a valid candidate for this position.");

        // increment vote!
        votes[positionName][candidateName] += 1;

        emit VoteCast(msg.sender, positionName, candidateName);
    }

    /**
     * @dev A public "read" function to get the tally for one candidate.
     */
    function getTally(string memory positionName, string memory candidateName) public view returns (uint256) {
        return votes[positionName][candidateName];
    }

    /**
     * @dev A public "read" function to get the list of all positions.
     */
    function getPositionList() public view returns (string[] memory) {
        return positionList;
    }

    /**
     * @dev A public "read" function to get all candidates for one position.
     */
    function getCandidateList(string memory positionName) public view returns (string[] memory) {
        return candidateList[positionName];
    }
}